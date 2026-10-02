import { describe, expect, it } from 'vitest';
import { ForbiddenError, NotFoundError, ValidationError } from '@/lib/errors';
import { APP, PRJ, RISK, USER } from '@/services/mock/data/ids';
import { createMemoryBlobStore } from './blobStore';
import { createMockRepositories } from './index';

const pdf = (text = '%PDF-1.4 test') => new Blob([text], { type: 'application/pdf' });
const upload = (overrides: Record<string, unknown> = {}) => ({
  owner: { type: 'application' as const, id: APP.customerIdentity },
  documentType: 'security-assessment',
  description: 'Sızma testi özeti',
  file: pdf(),
  fileName: 'CIP güvenlik değerlendirmesi.pdf',
  ...overrides,
});

describe('attachment repository', () => {
  it('stores the file, lists it on its record and returns the same bytes', async () => {
    const repos = createMockRepositories({ signedInAs: USER.canOzturk });
    const saved = await repos.attachments.upload(upload());
    expect(saved).toMatchObject({ fileName: 'CIP güvenlik değerlendirmesi.pdf', sizeBytes: 13 });
    const list = await repos.attachments.list({ type: 'application', id: APP.customerIdentity });
    expect(list[0]?.id).toBe(saved.id);
    expect(await (await repos.attachments.download(saved.id)).text()).toBe('%PDF-1.4 test');
    expect((await repos.attachments.countByOwner('application')).get(APP.customerIdentity)).toBe(2);
  });

  it('serves seed files as real PDFs', async () => {
    const repos = createMockRepositories({ signedInAs: USER.elifKaya });
    const [seed] = await repos.attachments.list({ type: 'project', id: PRJ.workforceMfa });
    if (!seed) throw new Error('seed missing');
    const blob = await repos.attachments.download(seed.id);
    const bytes = new Uint8Array(await blob.arrayBuffer());
    const text = String.fromCharCode(...bytes);
    expect(text.startsWith('%PDF-1.4')).toBe(true);
    expect(text.endsWith('%%EOF')).toBe(true);
    expect(bytes.length).toBe(seed.sizeBytes);
  });

  it('refuses dangerous types, empty or oversized files and secrets in descriptions', async () => {
    const repos = createMockRepositories({ signedInAs: USER.canOzturk });
    for (const fileName of ['kur.exe', 'sayfa.html', 'logo.svg', 'betik.js']) {
      await expect(repos.attachments.upload(upload({ fileName }))).rejects.toBeInstanceOf(
        ValidationError,
      );
    }
    await expect(repos.attachments.upload(upload({ file: new Blob([]) }))).rejects.toBeInstanceOf(
      ValidationError,
    );
    const big = { size: 21 * 1024 * 1024, type: 'application/pdf' } as Blob;
    await expect(repos.attachments.upload(upload({ file: big }))).rejects.toBeInstanceOf(
      ValidationError,
    );
    await expect(
      repos.attachments.upload(upload({ description: 'giriş password=abc123' })),
    ).rejects.toBeInstanceOf(ValidationError);
    await expect(repos.attachments.upload(upload({ documentType: 'nope' }))).rejects.toBeInstanceOf(
      ValidationError,
    );
    await expect(
      repos.attachments.upload(upload({ owner: { type: 'project', id: 9999 } })),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it('lets everyone read but only editors upload', async () => {
    const repos = createMockRepositories({ signedInAs: USER.elifKaya });
    expect((await repos.attachments.list({ type: 'risk', id: RISK.payDbSupport })).length).toBe(1);
    await expect(repos.attachments.upload(upload())).rejects.toBeInstanceOf(ForbiddenError);
  });

  it('deletes files with their record and drops the bytes', async () => {
    const blobs = createMemoryBlobStore();
    const repos = createMockRepositories({ signedInAs: USER.canOzturk, blobs });
    const saved = await repos.attachments.upload(
      upload({ owner: { type: 'risk', id: RISK.payDbSupport } }),
    );
    const impact = await repos.risks.getDeletionImpact(RISK.payDbSupport);
    expect(impact.references).toEqual([{ label: 'ek dosya (silinir)', count: 2 }]);
    await repos.risks.remove(RISK.payDbSupport);
    expect(await repos.attachments.list({ type: 'risk', id: RISK.payDbSupport })).toEqual([]);
    // A fresh backend over the same store clears bytes of files that no longer exist.
    createMockRepositories({ signedInAs: USER.canOzturk, blobs });
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(await blobs.get(saved.id)).toBeNull();
  });
});
