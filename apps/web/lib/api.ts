/**
 * Thin HTTP client shared by all React Query hooks.
 *
 * The module uses a module-level singleton pattern: `configureApi` is called once at
 * AuthProvider mount to register token/refresh callbacks. This avoids passing the auth
 * context through every hook while keeping the token getter always fresh via a ref.
 *
 * Token refresh flow:
 * 1. Request fires with the current access token.
 * 2. If the response is 401, `refreshFn` is called to obtain a new access token from
 *    the HttpOnly refresh-token cookie (via /api/auth/refresh).
 * 3. The original request is retried once with the new token.
 * 4. A second 401 after refresh lets the error propagate — the caller (React Query) will
 *    surface the error and the user will need to log in again.
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

let getTokenFn: (() => string | null) | null = null;
let refreshFn: (() => Promise<void>) | null = null;

/**
 * Wires up the token getter and refresh callback used by `apiRequest`.
 * Called once by `AuthProvider` on mount; safe to call again on refresh.
 */
export function configureApi(
  getToken: () => string | null,
  refresh: () => Promise<void>
) {
  getTokenFn = getToken;
  refreshFn = refresh;
}

/**
 * Sends an authenticated JSON request to the backend via the Nginx gateway.
 *
 * Automatically attaches the current Bearer token and handles a single silent token
 * refresh on 401. Throws on any non-2xx response (after refresh retry).
 * Returns `undefined` for 204 No Content responses.
 *
 * @param path    Absolute URL path starting with `/api/…` (gateway-routed).
 * @param options Standard `fetch` RequestInit (method, body, etc.).
 */
export async function apiRequest<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getTokenFn?.();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  let res = await fetch(`${API_URL}${path}`, { ...options, headers });

  if (res.status === 401 && refreshFn) {
    await refreshFn();
    const newToken = getTokenFn?.();
    if (newToken) headers['Authorization'] = `Bearer ${newToken}`;
    res = await fetch(`${API_URL}${path}`, { ...options, headers });
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err.message || res.statusText);
  }

  if (res.status === 204 || res.headers.get('content-length') === '0') {
    return undefined as T;
  }

  return res.json();
}
