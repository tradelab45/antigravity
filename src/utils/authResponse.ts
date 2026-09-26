/**
 * Decides whether a non-2xx auth response is an answer from this app's API,
 * or just the absence of a backend.
 *
 * Signup falls back to a local, offline registry when there is no API at all,
 * which is how a purely static deployment works. A static host answers
 * POST /api/auth/signup with an HTML 404, or a 405 for the POST, and that is
 * not a rejection of anyone's details.
 *
 * Anything with a JSON body is the API answering, whatever the status, and is
 * final. That includes the 503 the server sends when a verification code
 * cannot be delivered and sign-in fails closed, and the 503 for Google sign-in
 * with no client configured. Treating those as "no backend" would let the
 * browser skip the server's refusal and sign itself in offline, which is the
 * one thing the offline branch must never do. An HTML error that is not a 404
 * or 405, such as a proxy's 502, also stays a failure rather than quietly
 * moving someone to an offline account.
 */
export const isAuthApiRejection = (status: number, contentType: string | null): boolean => {
  if ((contentType || '').toLowerCase().includes('application/json')) return true;
  return !(status === 404 || status === 405);
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
