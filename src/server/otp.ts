import { randomBytes, randomInt, scryptSync, timingSafeEqual } from 'crypto';

/**
 * Email verification codes for sign-in.
 *
 * A code is issued once the first factor has already succeeded — a verified
 * Google credential, or a correct password — and the account is not released
 * until the code comes back. The code itself is never stored: only a salted
 * scrypt hash of it, so a dump of this process's memory does not hand an
 * attacker a working code.
 *
 * Challenges live in process memory. That is deliberate for a single-process
 * app: a restart invalidates every pending code, which is the safe direction
 * to fail in. Running more than one instance would need a shared store.
 */

export const CODE_LENGTH = 6;
export const CODE_TTL_MS = 10 * 60_000;
/** Wrong guesses allowed before the challenge is destroyed. */
export const MAX_ATTEMPTS = 5;

export type ChallengePurpose = 'login' | 'google';

interface Challenge {
  userId: string;
  email: string;
  purpose: ChallengePurpose;
  salt: Buffer;
  codeHash: Buffer;
  expiresAt: number;
  attempts: number;
}

const challenges = new Map<string, Challenge>();

const sweep = (now: number) => {
  for (const [id, challenge] of challenges) {
    if (challenge.expiresAt <= now) challenges.delete(id);
  }
};

const hashCode = (code: string, salt: Buffer): Buffer => scryptSync(code, salt, 32);

/**
 * A uniformly random numeric code. `randomInt` is rejection-sampled by Node,
 * so unlike `Math.random()` or a modulo of random bytes it has no bias toward
 * the low digits.
 */
export function generateCode(length: number = CODE_LENGTH): string {
  let code = '';
  for (let i = 0; i < length; i += 1) code += String(randomInt(0, 10));
  return code;
}

export interface IssuedChallenge {
  challengeId: string;
  code: string;
  expiresAt: number;
}

/** Creates a challenge and returns the plain code for delivery, once. */
export function issueChallenge(
  userId: string,
  email: string,
  purpose: ChallengePurpose,
  now: number = Date.now(),
): IssuedChallenge {
  sweep(now);

  const challengeId = randomBytes(24).toString('base64url');
  const code = generateCode();
  const salt = randomBytes(16);

  challenges.set(challengeId, {
    userId,
    email,
    purpose,
    salt,
    codeHash: hashCode(code, salt),
    expiresAt: now + CODE_TTL_MS,
    attempts: 0,
  });

  return { challengeId, code, expiresAt: now + CODE_TTL_MS };
}

/**
 * Replaces the code on an existing challenge, keeping the same id.
 *
 * Re-issuing rather than creating a second challenge means an older code stops
 * working the moment a new one is sent, so a resend cannot leave two live
 * codes for one sign-in.
 */
export function reissueCode(
  challengeId: string,
  now: number = Date.now(),
): (IssuedChallenge & { email: string }) | null {
  const challenge = challenges.get(challengeId);
  if (!challenge || challenge.expiresAt <= now) {
    challenges.delete(challengeId);
    return null;
  }

  const code = generateCode();
  const salt = randomBytes(16);
  challenge.salt = salt;
  challenge.codeHash = hashCode(code, salt);
  challenge.expiresAt = now + CODE_TTL_MS;
  challenge.attempts = 0;

  return { challengeId, code, expiresAt: challenge.expiresAt, email: challenge.email };
}

/**
 * One shape rather than a discriminated union: this project compiles without
 * `strict`, and without `strictNullChecks` TypeScript will not narrow a union
 * on a boolean discriminant, so callers would not see `reason` behind an
 * `if (!result.ok)`.
 */
export interface VerifyResult {
  ok: boolean;
  /** Set only when ok. */
  userId?: string;
  /** Set only when ok. */
  purpose?: ChallengePurpose;
  /** Set only when not ok. */
  reason?: 'unknown' | 'expired' | 'exhausted' | 'mismatch';
  attemptsLeft: number;
}

/**
 * Checks a code and consumes the challenge on success.
 *
 * A wrong code counts against the attempt cap, and the challenge is destroyed
 * once the cap is reached rather than left for the next guess.
 */
export function verifyChallenge(
  challengeId: string,
  code: string,
  now: number = Date.now(),
): VerifyResult {
  const challenge = challenges.get(challengeId);
  if (!challenge) return { ok: false, reason: 'unknown', attemptsLeft: 0 };

  if (challenge.expiresAt <= now) {
    challenges.delete(challengeId);
    return { ok: false, reason: 'expired', attemptsLeft: 0 };
  }

  challenge.attempts += 1;

  const supplied = String(code).trim();
  const candidate = hashCode(supplied, challenge.salt);
  // Equal-length buffers from the same hash, so timingSafeEqual cannot throw
  // and the comparison does not leak how much of the code was right.
  const matches = timingSafeEqual(candidate, challenge.codeHash);

  if (matches) {
    challenges.delete(challengeId);
    return { ok: true, userId: challenge.userId, purpose: challenge.purpose, attemptsLeft: MAX_ATTEMPTS };
  }

  const attemptsLeft = MAX_ATTEMPTS - challenge.attempts;
  if (attemptsLeft <= 0) {
    challenges.delete(challengeId);
    return { ok: false, reason: 'exhausted', attemptsLeft: 0 };
  }
  return { ok: false, reason: 'mismatch', attemptsLeft };
}

/** Drops a pending challenge, for a cancelled sign-in. */
export function discardChallenge(challengeId: string): void {
  challenges.delete(challengeId);
}

/** Test seam. */
export function clearChallenges(): void {
  challenges.clear();
}

/**
 * `a••••@example.com` — enough for the person to recognise their own inbox
 * without printing an address to anyone who reaches the sign-in screen.
 */
export function maskEmail(email: string): string {
  const [local, domain] = String(email).split('@');
  if (!domain) return '•••';
  const head = local.slice(0, 1);
  return `${head}${'•'.repeat(Math.max(3, local.length - 1))}@${domain}`;
}
