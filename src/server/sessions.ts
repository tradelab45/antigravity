import { createHmac, randomBytes, timingSafeEqual } from 'crypto';
import fs from 'fs';
import path from 'path';

/**
 * Server-issued sessions.
 *
 * Until now the session was `rr_current_user` in localStorage and an expiry
 * timestamp beside it, both of which the browser owns. Anyone could edit the
 * stored object to stay signed in past the timeout, or to become a different
 * account outright, because nothing was signed and nothing was checked.
 *
 * A session is now a token the server signs and can refuse:
 *
 *   <userId>.<issuedAt>.<expiresAt>.<tokenId>.<hmac>
 *
 * The HMAC covers the other four fields, so none of them can be edited — an
 * attacker cannot extend their own expiry or swap in another user's id without
 * the secret. The token id lets a single session be revoked on sign-out, and a
 * per-user epoch lets every session for an account be revoked at once, which is
 * what account deletion and a password change need.
 */

const TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;

/** Where a generated secret is kept when SESSION_SECRET is not set. */
const SECRET_FILE = path.join(process.cwd(), 'data', 'session-secret');

/**
 * A secret generated on first boot and kept on disk, shared by every process
 * that reads the same data directory.
 *
 * Without SESSION_SECRET the secret used to be random per process. On a host
 * that runs more than one process, or restarts often, a session signed by one
 * process was refused by the next: someone signed in, the page reloaded onto a
 * different process, and they were signed straight back out. The file is
 * created exclusively, so two processes starting together agree on whichever
 * wrote first, and it is readable by its owner only — it sits beside
 * users.json, behind the same boundary as the password hashes.
 *
 * If the file cannot be written, the process falls back to a secret of its
 * own, which is the old behaviour and still never a predictable one.
 */
function persistedSecret(): string | null {
  try {
    const existing = fs.readFileSync(SECRET_FILE, 'utf-8').trim();
    if (existing.length >= 32) return existing;
  } catch {
    // Not written yet.
  }

  const fresh = randomBytes(48).toString('hex');
  try {
    fs.mkdirSync(path.dirname(SECRET_FILE), { recursive: true });
    fs.writeFileSync(SECRET_FILE, fresh, { encoding: 'utf-8', mode: 0o600, flag: 'wx' });
    return fresh;
  } catch {
    // Another process won the race, or the directory is read-only.
    try {
      const winner = fs.readFileSync(SECRET_FILE, 'utf-8').trim();
      if (winner.length >= 32) return winner;
    } catch {
      // Nothing to agree on.
    }
  }
  return null;
}

let secretSource: 'configured' | 'file' | 'process' = 'process';

const SECRET = (() => {
  const configured = (process.env.SESSION_SECRET || '').trim();
  if (configured.length >= 32) {
    secretSource = 'configured';
    return configured;
  }
  if (configured.length > 0) {
    console.warn('[sessions] SESSION_SECRET is shorter than 32 characters; ignoring it.');
  }
  const stored = persistedSecret();
  if (stored) {
    secretSource = 'file';
    return stored;
  }
  console.warn('[sessions] No SESSION_SECRET and no writable data directory; sessions end when this process does.');
  return randomBytes(48).toString('hex');
})();

/** True when sessions survive a restart: a configured secret or one kept on disk. */
export const sessionSecretIsPersistent = (): boolean => secretSource !== 'process';

/** Token ids revoked by an explicit sign-out. */
const revokedTokens = new Set<string>();

/**
 * Per-user cut-off. Any token issued at or before this instant is refused,
 * which revokes every device at once.
 */
const userEpochs = new Map<string, number>();

const sign = (payload: string): string =>
  createHmac('sha256', SECRET).update(payload).digest('base64url');

export interface IssuedSession {
  token: string;
  expiresAt: number;
}

/**
 * The token is dot-delimited, so the user id has to survive without producing
 * one. `encodeURIComponent` does not escape a dot — it is an unreserved
 * character — so an id containing one would split the token into six parts and
 * be rejected as malformed. base64url has no dot in its alphabet.
 */
const encodeUserId = (userId: string): string => Buffer.from(userId, 'utf8').toString('base64url');
const decodeUserId = (encoded: string): string => Buffer.from(encoded, 'base64url').toString('utf8');

export function issueSession(userId: string, now: number = Date.now()): IssuedSession {
  const expiresAt = now + TOKEN_TTL_MS;
  const tokenId = randomBytes(12).toString('base64url');
  const payload = `${encodeUserId(userId)}.${now}.${expiresAt}.${tokenId}`;
  return { token: `${payload}.${sign(payload)}`, expiresAt };
}

export interface SessionClaims {
  userId: string;
  issuedAt: number;
  expiresAt: number;
  tokenId: string;
}

/**
 * Validates a token and returns its claims, or null.
 *
 * Every rejection returns the same null: a caller cannot learn from the
 * response whether a token was forged, expired or revoked.
 */
export function readSession(token: unknown, now: number = Date.now()): SessionClaims | null {
  if (typeof token !== 'string' || token.length === 0 || token.length > 512) return null;

  const parts = token.split('.');
  if (parts.length !== 5) return null;
  const [rawUserId, rawIssued, rawExpires, tokenId, providedSignature] = parts;

  const payload = `${rawUserId}.${rawIssued}.${rawExpires}.${tokenId}`;
  const expected = sign(payload);

  // Equal-length buffers, so timingSafeEqual cannot throw, and the comparison
  // does not leak how much of the signature was right.
  const a = Buffer.from(expected);
  const b = Buffer.from(providedSignature);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  const issuedAt = Number(rawIssued);
  const expiresAt = Number(rawExpires);
  if (!Number.isFinite(issuedAt) || !Number.isFinite(expiresAt)) return null;
  if (expiresAt <= now) return null;

  if (revokedTokens.has(tokenId)) return null;

  let userId: string;
  try {
    userId = decodeUserId(rawUserId);
  } catch {
    return null;
  }
  if (!userId) return null;

  const epoch = userEpochs.get(userId);
  if (epoch !== undefined && issuedAt <= epoch) return null;

  return { userId, issuedAt, expiresAt, tokenId };
}

/** Ends one session. */
export function revokeSession(token: unknown): void {
  if (typeof token !== 'string') return;
  const tokenId = token.split('.')[3];
  if (tokenId) revokedTokens.add(tokenId);
}

/** Ends every session for an account, on every device. */
export function revokeAllSessionsForUser(userId: string, now: number = Date.now()): void {
  userEpochs.set(userId, now);
}

/**
 * Ends every session for an account and returns a replacement for the caller.
 *
 * A password change has to drop whoever else is holding a session, but not
 * the browser doing the changing. The cut-off is compared with `<=`, so a
 * token issued in the same millisecond as the revoke would be refused along
 * with the rest; issuing the replacement one millisecond later makes it
 * survive by construction rather than by timing.
 */
export function rotateSessionsForUser(userId: string, now: number = Date.now()): IssuedSession {
  const previous = userEpochs.get(userId);
  // The cut-off only ever moves forward. Rotating twice within one
  // millisecond would otherwise leave the first replacement alive, because it
  // was issued a millisecond past a cut-off that had not moved.
  const cutOff = previous === undefined ? now : Math.max(now, previous + 1);
  userEpochs.set(userId, cutOff);
  return issueSession(userId, cutOff + 1);
}

/** Test seam. */
export function clearSessions(): void {
  revokedTokens.clear();
  userEpochs.clear();
}

export const SESSION_COOKIE = 'rr_session';
export const SESSION_TTL_MS = TOKEN_TTL_MS;

/**
 * Cookie attributes.
 *
 * httpOnly keeps the token out of reach of any script on the page, so an XSS
 * bug cannot walk away with a session. SameSite=Lax stops another site posting
 * to these routes with the cookie attached. Secure is set in production, and
 * left off in development so the flow works over plain http on localhost.
 */
export function sessionCookieOptions(expiresAt: number) {
  return {
    httpOnly: true as const,
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    expires: new Date(expiresAt),
  };
}
