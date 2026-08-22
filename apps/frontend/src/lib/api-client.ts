export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface ApiErrorPayload {
  message: string | string[];
  statusCode?: number;
  error?: string;
}

export class ApiClientError extends Error {
  readonly status: number;
  readonly payload: ApiErrorPayload | null;

  constructor(status: number, payload: ApiErrorPayload | null, fallbackMessage: string) {
    const resolvedMessage = Array.isArray(payload?.message)
      ? payload.message.join(', ')
      : payload?.message;

    super(resolvedMessage ?? fallbackMessage);
    this.name = 'ApiClientError';
    this.status = status;
    this.payload = payload;
  }
}

export interface RequestOptions<TBody = unknown> {
  method?: HttpMethod;
  body?: TBody;
  token?: string;
  headers?: HeadersInit;
  cache?: RequestCache;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3001/api/v1';

async function parseError(response: Response): Promise<ApiErrorPayload | null> {
  try {
    return (await response.json()) as ApiErrorPayload;
  } catch {
    return null;
  }
}

export async function apiRequest<TResponse, TBody = unknown>(
  endpoint: string,
  options: RequestOptions<TBody> = {},
): Promise<TResponse> {
  const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  const headers = new Headers(options.headers);
  headers.set('Content-Type', 'application/json');

  if (options.token) {
    headers.set('Authorization', `Bearer ${options.token}`);
  }

  const init: RequestInit = {
    method: options.method ?? 'GET',
    headers,
    cache: options.cache ?? 'no-store',
  };

  if (options.body !== undefined) {
    init.body = JSON.stringify(options.body);
  }

  const response = await fetch(url, init);

  if (!response.ok) {
    const errorPayload = await parseError(response);
    throw new ApiClientError(response.status, errorPayload, 'Request failed');
  }

  return (await response.json()) as TResponse;
}

export async function apiUpload<TResponse>(
  endpoint: string,
  body: FormData,
  options: Pick<RequestOptions<never>, 'token' | 'headers' | 'cache'> = {},
): Promise<TResponse> {
  const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  const headers = new Headers(options.headers);

  if (options.token) {
    headers.set('Authorization', `Bearer ${options.token}`);
  }

  const response = await fetch(url, {
    method: 'POST',
    headers,
    body,
    cache: options.cache ?? 'no-store',
  });

  if (!response.ok) {
    const errorPayload = await parseError(response);
    throw new ApiClientError(response.status, errorPayload, 'Upload failed');
  }

  return (await response.json()) as TResponse;
}
