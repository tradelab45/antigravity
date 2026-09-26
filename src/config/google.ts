/**
 * The Google OAuth client the sign-in button uses when nothing else is set.
 *
 * A client ID is public — it is in every page that shows the button — so it
 * is safe to ship. It lives here so the browser and the server agree on it:
 * the server has to verify a Google credential against the same client the
 * browser obtained it from, and when only the browser knew this fallback, a
 * learner could finish Google's sign-in and then be told by the server that
 * Google sign-in was not configured.
 */
export const FALLBACK_GOOGLE_CLIENT_ID =
  '92444997475-pplpa69ma4mv6l6ubs1r65apboehdn9n.apps.googleusercontent.com';

export const isGoogleClientId = (value: unknown): value is string =>
  typeof value === 'string' &&
  value.trim().endsWith('.apps.googleusercontent.com') &&
  !value.includes('YOUR_GOOGLE_CLIENT_ID');
