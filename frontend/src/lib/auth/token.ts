export const AUTH_TOKEN_KEY = 'outbox.jwt';

/** getAuthToken helper. */
export function getAuthToken() {
  if (typeof window === 'undefined') return undefined;
  return window.localStorage.getItem(AUTH_TOKEN_KEY) ?? undefined;
}

/** setAuthToken helper. */
export function setAuthToken(token: string) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(AUTH_TOKEN_KEY, token);
}

/** clearAuthToken helper. */
export function clearAuthToken() {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(AUTH_TOKEN_KEY);
}
