/**
 * A small fixed-window rate limiter for the auth routes.
 *
 * The sign-in endpoints had no throttle at all, so a password or a six-digit
 * verification code could be guessed as fast as the server would answer. This
 * keeps counters in process memory: the app runs as a single Node process, and
 * a limiter that forgets everything on restart is still far better than none.
 * If this ever runs behind more than one instance, move the store to Redis —
 * the interface below is deliberately narrow enough to swap.
 */

export interface RateLimitRule {
  /** How many attempts are allowed inside the window. */
  limit: number;
  /** Window length in milliseconds. */
  windowMs: number;
}

export interface RateLimitVerdict {
  allowed: boolean;
  /** Attempts left in the current window, after this one. */
  remaining: number;
  /** Seconds until the window resets, for Retry-After. */
  retryAfterSeconds: number;
}

interface Counter {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Counter>();

/** Dropped entries stop the map growing without bound on a long-lived process. */
const sweep = (now: number) => {
  if (buckets.size < 2000) return;
  for (const [key, counter] of buckets) {
    if (counter.resetAt <= now) buckets.delete(key);
  }
};

/**
 * Records one attempt against `key` and says whether it is allowed.
 *
 * Counting on every call, including the ones that are refused, is deliberate:
 * an attacker who keeps hammering a blocked key keeps it blocked.
 */
export function consume(key: string, rule: RateLimitRule, now: number = Date.now()): RateLimitVerdict {
  sweep(now);

  const existing = buckets.get(key);
  if (!existing || existing.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + rule.windowMs });
    return { allowed: true, remaining: rule.limit - 1, retryAfterSeconds: Math.ceil(rule.windowMs / 1000) };
  }

  existing.count += 1;
  const retryAfterSeconds = Math.max(1, Math.ceil((existing.resetAt - now) / 1000));
  if (existing.count > rule.limit) {
    return { allowed: false, remaining: 0, retryAfterSeconds };
  }
  return { allowed: true, remaining: rule.limit - existing.count, retryAfterSeconds };
}

/** Clears a key after a success, so one good sign-in resets the run of failures. */
export function reset(key: string): void {
  buckets.delete(key);
}

/** Test seam. */
export function clearAll(): void {
  buckets.clear();
}

/**
 * The client address to count against.
 *
 * `trust proxy` is not enabled on this app, so `req.ip` is the socket address
 * and an `X-Forwarded-For` header cannot be used to forge a fresh identity.
 * Behind a reverse proxy that address is the proxy's, which makes the IP rule
 * a coarse global cap — that is why the rules below also key on the account
 * being targeted.
 */
export function clientKey(address: string | undefined): string {
  return (address || 'unknown').replace(/^::ffff:/, '');
}
