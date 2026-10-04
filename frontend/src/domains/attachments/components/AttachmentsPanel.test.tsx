import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { createMockRepositories } from '@/services/mock';
import { APP, RISK } from '@/services/mock/data/ids';
import { renderRoute, TEST_VIEWER } from '@/test/renderWithProviders';

const fileInputs = () => [...document.querySelectorAll<HTMLInputElement>('input[type="file"]')];

describe('attachments', () => {
  it('shows the required documents and uploads into a missing one', async () => {
    const user = userEvent.setup({ applyAccept: false });
    const { repositories } = renderRoute(`/applications/${APP.customerIdentity}?tab=documentation`);
    const checklist = await screen.findByRole('region', { name: 'Gerekli belgeler' });
    expect(within(checklist).getByText('1/3 yüklendi', { exact: false })).toBeInTheDocument();
    expect(within(checklist).getAllByText('Eksik')).toHaveLength(2);

    // The checklist row's own picker files straight into that document type.
    const security = within(checklist).getByRole('button', {
      name: 'Güvenlik değerlendirmesi yükle',
    });
    const rowInput = security
      .closest('.c-required-doc')
      ?.querySelector<HTMLInputElement>('input[type="file"]');
    if (!rowInput) throw new Error('row picker missing');
    await user.upload(
      rowInput,
      new File(['%PDF-1.4 güvenlik'], 'CIP sızma testi.pdf', { type: 'application/pdf' }),
    );

    await waitFor(() =>
      expect(within(checklist).getByText('2/3 yüklendi', { exact: false })).toBeInTheDocument(),
    );
    const saved = await repositories.attachments.list({
      type: 'application',
      id: APP.customerIdentity,
    });
    expect(saved.find((a) => a.fileName === 'CIP sızma testi.pdf')?.documentType).toBe(
      'security-assessment',
    );
  });

  it('uploads several files at once and explains a refused one', async () => {
    const user = userEvent.setup({ applyAccept: false });
    renderRoute(`/applications/${APP.customerIdentity}?tab=documentation`);
    await screen.findByText('Dosyaları buraya sürükleyip bırakın');
    const main = fileInputs().find((input) => input.multiple);
    if (!main) throw new Error('main picker missing');
    await user.upload(main, [
      new File(['notlar'], 'Toplantı notları.docx', {
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      }),
      new File(['MZ'], 'kurulum.exe', { type: 'application/x-msdownload' }),
    ]);
    expect(await screen.findByText(/kurulum\.exe: bu dosya türü yüklenemez/)).toBeInTheDocument();
    expect(
      await screen.findByRole('button', { name: 'Dosyayı indir: Toplantı notları.docx' }),
    ).toBeInTheDocument();
  });

  it('lets read-only users open files but not upload or delete', async () => {
    renderRoute(
      `/applications/${APP.paymentGateway}?tab=documentation`,
      createMockRepositories({ signedInAs: TEST_VIEWER }),
    );
    expect(await screen.findByText('3/3 yüklendi', { exact: false })).toBeInTheDocument();
    expect(screen.queryByText('Dosyaları buraya sürükleyip bırakın')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^Sil: / })).not.toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /^Dosyayı indir: / }).length).toBeGreaterThan(0);
  });

  it('opens a register row’s files in a dialog', async () => {
    const user = userEvent.setup();
    renderRoute('/risks?tab=risks');
    // Owner names resolve in a second pass; let the register settle before opening a dialog.
    await screen.findAllByText('Jonas Berg');
    const button = await screen.findByRole('button', {
      name: /^Ekler: Ödeme defteri veritabanı desteği bitmiş sürümde \(1\)$/,
    });
    await user.click(button);
    const dialog = await screen.findByRole('dialog', { name: /Ekler: Ödeme defteri/ });
    expect(
      await within(dialog).findByText('Oracle 12c — Yama durumu değerlendirmesi.pdf'),
    ).toBeInTheDocument();
    expect(RISK.payDbSupport).toBeGreaterThan(0);
  });
});
