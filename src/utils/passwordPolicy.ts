/**
 * What counts as an acceptable password here.
 *
 * Shared by the server, which enforces it, and the sign-up and reset forms,
 * which use it to say what is wrong before a round trip. The server is still
 * the authority — a rule checked only in the browser is a rule anyone can
 * skip — but both read the same list, so the two never disagree.
 *
 * The only rule was a length between 8 and 128, so `password` and `12345678`
 * were both fine. The rules below are deliberately about what makes a password
 * hard to guess rather than about decorating it: a long passphrase passes
 * without needing a symbol, and a short one with a symbol bolted on does not.
 */

export const MIN_PASSWORD_LENGTH = 10;
export const MAX_PASSWORD_LENGTH = 128;

/**
 * Passwords that appear at the top of every breach list, plus the ones this
 * app invites by name. Not a substitute for a breach corpus — it is the small
 * set that would otherwise sail through any length rule.
 */
const COMMON_PASSWORDS = new Set([
  'password', 'password1', 'password123', 'passw0rd', 'p@ssword', 'p@ssw0rd',
  '12345678', '123456789', '1234567890', 'qwertyuiop', 'qwerty123',
  'iloveyou', 'admin123', 'administrator', 'letmein123', 'welcome123', 'abc123456',
  'rupeerookie', 'rupeerookie1', 'dalalstreet', 'nifty50', 'sensex123', 'trading123',
  'stockmarket', 'investor123',
]);

export interface PasswordVerdict {
  ok: boolean;
  /** Shown to the person, so it says what to change rather than just "invalid". */
  message: string;
}

const hasRepeatedRun = (password: string): boolean => /(.)\1{3,}/.test(password);

const isSequential = (password: string): boolean => {
  const lower = password.toLowerCase();
  let ascending = 1;
  let descending = 1;
  for (let i = 1; i < lower.length; i += 1) {
    const step = lower.charCodeAt(i) - lower.charCodeAt(i - 1);
    ascending = step === 1 ? ascending + 1 : 1;
    descending = step === -1 ? descending + 1 : 1;
    if (ascending >= 5 || descending >= 5) return true;
  }
  return false;
};

/**
 * Checks a password, optionally against the person's own details.
 *
 * Their name, username and email local part are refused because those are the
 * first things anyone trying the account already knows.
 */
export function checkPassword(
  password: unknown,
  identity: { fullName?: string; username?: string; email?: string } = {},
): PasswordVerdict {
  if (typeof password !== 'string' || password.length === 0) {
    return { ok: false, message: 'Choose a password.' };
  }
  if (password.length < MIN_PASSWORD_LENGTH) {
    return {
      ok: false,
      message: `Use at least ${MIN_PASSWORD_LENGTH} characters. A short phrase you will remember beats a short word with a symbol in it.`,
    };
  }
  if (password.length > MAX_PASSWORD_LENGTH) {
    return { ok: false, message: `Keep it under ${MAX_PASSWORD_LENGTH} characters.` };
  }

  const lower = password.toLowerCase();

  if (COMMON_PASSWORDS.has(lower)) {
    return { ok: false, message: 'That is one of the most guessed passwords there is. Choose another.' };
  }
  if (hasRepeatedRun(password)) {
    return { ok: false, message: 'Avoid runs of the same character, like aaaa.' };
  }
  if (isSequential(password)) {
    return { ok: false, message: 'Avoid straight runs like 12345 or abcde.' };
  }

  // Their own details are the first guesses anyone makes.
  const personal = [
    identity.username,
    identity.fullName,
    (identity.email || '').split('@')[0],
  ]
    .map((value) => String(value || '').trim().toLowerCase())
    .filter((value) => value.length >= 4);

  for (const value of personal) {
    if (lower.includes(value)) {
      return { ok: false, message: 'Do not put your name, username or email in your password.' };
    }
  }

  // A single repeated word is weak however long it is.
  const distinct = new Set(password).size;
  if (distinct < 5) {
    return { ok: false, message: 'Use a wider mix of characters.' };
  }

  return { ok: true, message: 'That password is fine.' };
}
