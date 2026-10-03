import {
  AppError,
  ForbiddenError,
  NotFoundError,
  UnauthenticatedError,
  ValidationError,
} from '@/lib/errors';

/** Query string values; `undefined`/`null` are left out, arrays repeat the key. */
export type QueryValue =
  string | number | boolean | null | undefined | readonly (string | number)[];
export type Query = Record<string, QueryValue>;

export interface HttpClientOptions {
  /** API origin; empty for the same origin as the app (the default, behind one gateway). */
  baseUrl?: string;
  fetch?: typeof fetch;
  /** The CSRF token sent with writes; by default read from the `XSRF-TOKEN` cookie. */
  csrfToken?: () => string | null;
}

/** RFC 9457 problem details as the API answers errors (`code` matches the error classes). */
interface Problem {
  code?: string;
  detail?: string;
  field?: string;
}

const UNREACHABLE = 'Sunucuya ulaşılamadı. Bağlantınızı kontrol edip tekrar deneyin.';

function readCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.split('; ').find((part) => part.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.slice(name.length + 1)) : null;
}

export function queryString(query: Query = {}): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null) continue;
    if (Array.isArray(value)) {
      for (const item of value as readonly (string | number)[]) params.append(key, String(item));
    } else {
      params.append(key, String(value));
    }
  }
  const text = params.toString();
  return text ? `?${text}` : '';
}

/** The API's error answer as the error classes the UI already understands. */
export async function toError(response: Response): Promise<AppError> {
  let problem: Problem = {};
  try {
    problem = (await response.json()) as Problem;
  } catch {
    // Not a problem document (proxy error page, empty body).
  }
  const message = problem.detail || 'Beklenmeyen bir hata oluştu.';
  switch (problem.code ?? statusCode(response.status)) {
    case 'validation':
      return new ValidationError(message, problem.field);
    case 'not-found': {
      const error = new NotFoundError('Kayıt', '');
      error.message = message;
      return error;
    }
    case 'forbidden':
      return new ForbiddenError(message);
    case 'unauthenticated':
      return new UnauthenticatedError();
    default:
      return new AppError(message, 'unknown');
  }
}

function statusCode(status: number): string {
  if (status === 400 || status === 422) return 'validation';
  if (status === 401) return 'unauthenticated';
  if (status === 403) return 'forbidden';
  if (status === 404) return 'not-found';
  return 'unknown';
}

/**
 * JSON over HTTP to the Cerebro API. The session is an httpOnly cookie (never a token in the
 * browser); writes carry the CSRF token the API set in a readable cookie.
 */
export function createHttpClient({
  baseUrl = '',
  fetch: send = (...args) => globalThis.fetch(...args),
  csrfToken = () => readCookie('XSRF-TOKEN'),
}: HttpClientOptions = {}) {
  async function request(method: string, path: string, body?: BodyInit, json = false) {
    const headers: Record<string, string> = { Accept: 'application/json' };
    if (json) headers['Content-Type'] = 'application/json';
    if (method !== 'GET') {
      const token = csrfToken();
      if (token) headers['X-XSRF-TOKEN'] = token;
    }
    let response: Response;
    try {
      response = await send(`${baseUrl}${path}`, {
        method,
        headers,
        body,
        credentials: 'include',
      });
    } catch {
      throw new AppError(UNREACHABLE, 'network');
    }
    if (!response.ok) throw await toError(response);
    return response;
  }

  async function readJson<T>(response: Response): Promise<T> {
    if (response.status === 204) return null as T;
    const text = await response.text();
    return (text ? JSON.parse(text) : null) as T;
  }

  return {
    get: async <T>(path: string, query?: Query) =>
      readJson<T>(await request('GET', `${path}${queryString(query)}`)),
    post: async <T>(path: string, body?: unknown) =>
      readJson<T>(await request('POST', path, JSON.stringify(body ?? {}), true)),
    put: async <T>(path: string, body: unknown) =>
      readJson<T>(await request('PUT', path, JSON.stringify(body), true)),
    delete: async (path: string) => void (await request('DELETE', path)),
    /** Multipart upload; the browser sets the boundary. */
    postForm: async <T>(path: string, form: FormData) =>
      readJson<T>(await request('POST', path, form)),
    blob: async (path: string) => (await request('GET', path)).blob(),
  };
}

export type HttpClient = ReturnType<typeof createHttpClient>;
