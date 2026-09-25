/**
 * Decides whether a non-2xx auth response is an authoritative rejection from
 * our own API, or just the absence of a backend.
 *
 * Signup and login both fall back to a local/offline registry when the API
 * cannot be reached, which is how the static deployments (Netlify, Vercel,
 * Hostinger) work at all. A blanket `if (!res.ok) return error` makes that
 * fallback unreachable: a static host answers POST /api/auth/signup with a
 * 404/405 and an HTML body, which is not a rejection of the user's details.
 *
 * Only treat the response as a rejection when the API actually answered —
 * a JSON body, or a rate-limit status we recognise.
 */
export const isAuthApiRejection = (status: number, contentType: string | null): boolean => {
  if (status === 429) return true;
  // Routing-level misses mean "no backend here", never "bad credentials".
  if (status === 404 || status === 405 || status === 501 || status === 502 || status === 503) return false;
  return (contentType || '').toLowerCase().includes('application/json');
};

/**
 * Pulls the human-readable reason out of an API error body.
 *
 * The server answers with two different shapes. The auth routes use
 * `{ success: false, message }`, but thirteen other responses — including the
 * API 404 catch-all and the global 500 error handler — use
 * `{ success: false, error }`. Reading only `message` silently discarded the
 * reason from the second shape and showed the caller's generic fallback
 * instead, so a sign-in against a missing route or a crashing handler reported
 * "Sign-in was rejected. Please check your details." rather than what happened.
 */
export const extractApiErrorMessage = (body: unknown): string | null => {
  if (!body || typeof body !== 'object') return null;
  const candidates = [(body as Record<string, unknown>).message, (body as Record<string, unknown>).error];
  for (const candidate of candidates) {
    if (typeof candidate === 'string' && candidate.trim()) return candidate;
  }
  return null;
};

/** Server-side username rule, mirrored client-side so signup fails fast and locally. */
export const USERNAME_PATTERN = /^[a-z0-9_]{3,30}$/;

export const validateUsername = (raw: string): string | null => {
  const clean = raw.trim().toLowerCase();
  if (!clean) return 'Please choose a username';
  if (!USERNAME_PATTERN.test(clean)) {
    return 'Username must be 3–30 characters using only letters, numbers, or underscores.';
  }
  return null;
};

/** Server-side email rule, mirrored client-side. */
export const validateEmail = (raw: string): string | null => {
  const clean = raw.trim().toLowerCase();
  if (!clean) return 'Please provide a valid email address';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean)) return 'Please enter a valid email address.';
  return null;
};
