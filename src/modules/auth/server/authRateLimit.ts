import { rateLimit } from 'express-rate-limit';

export function createAuthLimiter(limit: number, windowMs = 15 * 60 * 1000) {
  return rateLimit({
    windowMs,
    limit,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: { success: false, message: 'Too many sign-in attempts. Please wait and try again.' },
  });
}
