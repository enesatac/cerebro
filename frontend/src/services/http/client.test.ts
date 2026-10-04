import { describe, expect, it } from 'vitest';
import { AppError, ForbiddenError, NotFoundError, ValidationError } from '@/lib/errors';
import { createHttpClient, queryString } from './client';
import { createHttpRepositories } from './httpRepositories';

interface Sent {
  url: string;
  method: string;
  headers: Headers;
  body: BodyInit | null | undefined;
}

/** A fetch double: records requests and answers with `reply`. */
function fakeFetch(reply: (sent: Sent) => Response = () => Response.json({})) {
  const sent: Sent[] = [];
  const send: typeof fetch = async (input, init = {}) => {
    const request = {
      url: String(input),
      method: init.method ?? 'GET',
      headers: new Headers(init.headers),
      body: init.body,
    };
    sent.push(request);
    return reply(request);
  };
  return { sent, fetch: send };
}

const problem = (status: number, body: object) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/problem+json' },
  });

describe('http client', () => {
  it('builds query strings, repeating arrays and leaving out empty values', () => {
    expect(queryString({ a: 1, b: undefined, c: null, d: ['x', 'y'], e: '' })).toBe(
      '?a=1&d=x&d=y&e=',
    );
    expect(queryString({})).toBe('');
  });

  it('sends the CSRF token with writes only', async () => {
    const { sent, fetch } = fakeFetch();
    const http = createHttpClient({
      baseUrl: 'https://api.example',
      fetch,
      csrfToken: () => 'tok',
    });
    await http.get('/api/teams', { page: 1 });
    await http.post('/api/teams', { name: 'A' });
    expect(sent[0]?.url).toBe('https://api.example/api/teams?page=1');
    expect(sent[0]?.headers.has('X-XSRF-TOKEN')).toBe(false);
    expect(sent[1]?.headers.get('X-XSRF-TOKEN')).toBe('tok');
    expect(sent[1]?.headers.get('Content-Type')).toBe('application/json');
    expect(sent[1]?.body).toBe('{"name":"A"}');
  });

  it('reads 204 as null', async () => {
    const { fetch } = fakeFetch(() => new Response(null, { status: 204 }));
    await expect(createHttpClient({ fetch }).get('/api/auth/session')).resolves.toBeNull();
  });

  it('turns problem details into the error classes the UI knows', async () => {
    const answers = [
      problem(400, { code: 'validation', detail: 'Başlık zorunludur.', field: 'title' }),
      problem(404, { code: 'not-found', detail: 'Proje "9" bulunamadı.' }),
      problem(403, { code: 'forbidden', detail: 'Bu işlemi yapma yetkiniz yok.' }),
      problem(401, { code: 'unauthenticated' }),
      new Response('<html>Bad gateway</html>', { status: 502 }),
    ];
    const { fetch } = fakeFetch(() => answers.shift() ?? Response.json({}));
    const http = createHttpClient({ fetch });

    const validation = await http.post('/api/x').catch((e: unknown) => e);
    expect(validation).toBeInstanceOf(ValidationError);
    expect(validation).toMatchObject({ message: 'Başlık zorunludur.', field: 'title' });
    const missing = await http.get('/api/x').catch((e: unknown) => e);
    expect(missing).toBeInstanceOf(NotFoundError);
    expect((missing as Error).message).toBe('Proje "9" bulunamadı.');
    await expect(http.get('/api/x')).rejects.toBeInstanceOf(ForbiddenError);
    await expect(http.get('/api/x')).rejects.toMatchObject({ code: 'unauthenticated' });
    await expect(http.get('/api/x')).rejects.toMatchObject({ code: 'unknown' });
  });

  it('reports an unreachable server as a network error', async () => {
    const http = createHttpClient({
      fetch: () => Promise.reject(new TypeError('Failed to fetch')),
    });
    const error = await http.get('/api/x').catch((e: unknown) => e);
    expect(error).toBeInstanceOf(AppError);
    expect(error).toMatchObject({ code: 'network' });
  });
});

describe('http repositories', () => {
  it('maps list queries onto the REST resources', async () => {
    const { sent, fetch } = fakeFetch(() => Response.json({ items: [], total: 0 }));
    const api = createHttpRepositories(createHttpClient({ fetch, csrfToken: () => null }));
    await api.applications.list({
      page: 0,
      pageSize: 25,
      search: 'öde',
      lifecycles: ['active', 'maintenance'],
      sort: { field: 'criticality', direction: 'desc' },
    });
    await api.leaves.list({ from: '2026-10-01', to: '2026-10-31', personIds: [] });
    await api.allocations.list({ from: '2026-10-01', to: '2026-10-31', projectIds: [3, 4] });
    await api.risks.list({ projectId: 2 });
    const urls = sent.map((request) => decodeURIComponent(request.url));
    expect(urls).toEqual([
      '/api/applications?page=0&pageSize=25&search=öde&lifecycles=active&lifecycles=maintenance&sort=criticality&direction=desc',
      '/api/leaves?from=2026-10-01&to=2026-10-31&personIds=',
      '/api/allocations?from=2026-10-01&to=2026-10-31&projectIds=3,4',
      '/api/risks?projectId=2',
    ]);
  });

  it('turns file counts into a map and uploads files as multipart', async () => {
    const { sent, fetch } = fakeFetch((request) =>
      request.method === 'GET' ? Response.json({ '3': 2, '7': 1 }) : Response.json({ id: 1 }),
    );
    const api = createHttpRepositories(createHttpClient({ fetch, csrfToken: () => 't' }));
    expect(await api.attachments.countByOwner('project')).toEqual(
      new Map([
        [3, 2],
        [7, 1],
      ]),
    );
    await api.attachments.upload({
      owner: { type: 'project', id: 3 },
      documentType: 'charter',
      description: 'Proje bildirgesi',
      file: new Blob(['%PDF'], { type: 'application/pdf' }),
      fileName: 'bildirge.pdf',
    });
    const upload = sent[1];
    expect(upload?.url).toBe('/api/attachments');
    const form = upload?.body as FormData;
    expect(form.get('ownerType')).toBe('project');
    expect(form.get('ownerId')).toBe('3');
    expect((form.get('file') as File).name).toBe('bildirge.pdf');
    // The browser sets the multipart boundary itself.
    expect(upload?.headers.has('Content-Type')).toBe(false);
  });

  it('reads an application without a runbook as null', async () => {
    const { fetch } = fakeFetch(() => new Response(null, { status: 204 }));
    const api = createHttpRepositories(createHttpClient({ fetch }));
    await expect(api.runbooks.getByApplication(4)).resolves.toBeNull();
  });
});
