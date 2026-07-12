// A small typed wrapper around fetch for talking to the Express API.
// The important bit is `credentials: 'include'`: it tells the browser to send
// (and store) our httpOnly auth cookies on every call.
import { API_URL } from './env';

// Shape of the API's error responses, so callers can read a friendly message.
export interface ApiError {
  message: string;
  code: string;
  details?: unknown;
}

// Thrown when the API returns a non-2xx status.
export class ApiRequestError extends Error {
  public readonly status: number;
  public readonly code: string;
  public readonly details?: unknown;
  constructor(status: number, error: ApiError) {
    super(error.message);
    this.status = status;
    this.code = error.code;
    this.details = error.details;
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    credentials: 'include', // send/receive the auth cookies
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  // 204 No Content: nothing to parse.
  if (res.status === 204) {
    return undefined as T;
  }

  const body = await res.json().catch(() => ({}));

  if (!res.ok) {
    const error: ApiError = body.error ?? { message: 'Request failed', code: 'UNKNOWN' };
    throw new ApiRequestError(res.status, error);
  }

  return body as T;
}

// Convenience methods.
export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, data?: unknown) =>
    request<T>(path, { method: 'POST', body: data ? JSON.stringify(data) : undefined }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
};
