const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

let getTokenFn: (() => string | null) | null = null;
let refreshFn: (() => Promise<void>) | null = null;

export function configureApi(
  getToken: () => string | null,
  refresh: () => Promise<void>
) {
  getTokenFn = getToken;
  refreshFn = refresh;
}

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
