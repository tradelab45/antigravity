import { createHash, randomBytes } from 'crypto';

/**
 * The registry behind a class board.
 *
 * A class code used to be nothing but a string on each account: anyone who
 * knew it could join, nobody owned it, and it lived forever. A teacher had no
 * way to remove a learner who should not be on the board, and last year's
 * class kept turning up on this year's.
 *
 * A board created here has an owner, an expiry and a removal list. Codes that
 * were already in use have no record and keep working exactly as before —
 * unowned and unmanaged — because inventing an owner for them would hand one
 * learner control of a board they simply joined first.
 */

export const CLASS_CODE_PATTERN = /^[A-Z0-9-]{4,16}$/;

/** How long a new board lasts before joins are refused. One school year. */
export const DEFAULT_CLASS_DAYS = 300;
export const MAX_CLASS_DAYS = 400;

export interface ClassRoom {
  code: string;
  ownerId: string;
  createdAt: string;
  /** Epoch milliseconds. Joins are refused past this; the board goes read-only. */
  expiresAt: number;
  /** Per-room salt, so a member handle reveals nothing about the account. */
  salt: string;
  /** Handles the owner has removed. They cannot rejoin until readmitted. */
  removed: string[];
}

export const normaliseClassCode = (value: unknown): string | null => {
  const code = String(value ?? '').trim().toUpperCase();
  return CLASS_CODE_PATTERN.test(code) ? code : null;
};

/**
 * A stable, opaque handle for one member of one board.
 *
 * The board deliberately publishes no account ids, so removing somebody needs
 * a name for them that is useless anywhere else: this one is derived from the
 * room's own salt, so the same learner has a different handle on every board
 * and the handle cannot be turned back into an account.
 */
export const memberHandle = (room: ClassRoom, userId: string): string =>
  createHash('sha256').update(`${room.salt}:${userId}`).digest('hex').slice(0, 12);

export const roomExpired = (room: ClassRoom, now: number = Date.now()): boolean =>
  room.expiresAt <= now;

/** A readable code for a teacher who does not want to invent one. */
export function generateClassCode(random: () => Buffer = () => randomBytes(4)): string {
  // No I, O, 0 or 1: a code gets read off a whiteboard and typed by thirty
  // people, and those are the four characters that get typed as each other.
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const bytes = random();
  let code = '';
  for (let i = 0; i < 4; i += 1) code += alphabet[bytes[i] % alphabet.length];
  return `CLASS-${code}`;
}

export function createRoom(
  code: string,
  ownerId: string,
  days: number = DEFAULT_CLASS_DAYS,
  now: number = Date.now(),
): ClassRoom {
  const span = Number.isFinite(days) && days > 0 ? Math.min(Math.floor(days), MAX_CLASS_DAYS) : DEFAULT_CLASS_DAYS;
  return {
    code,
    ownerId,
    createdAt: new Date(now).toISOString(),
    expiresAt: now + span * 24 * 60 * 60_000,
    salt: randomBytes(16).toString('hex'),
    removed: [],
  };
}

/** Pushes the expiry out from now. Never inwards, and never past the ceiling. */
export function extendRoom(room: ClassRoom, days: number, now: number = Date.now()): ClassRoom {
  const span = Number.isFinite(days) && days > 0 ? Math.min(Math.floor(days), MAX_CLASS_DAYS) : DEFAULT_CLASS_DAYS;
  return { ...room, expiresAt: Math.max(room.expiresAt, now + span * 24 * 60 * 60_000) };
}

/**
 * Accepts a registry read off disk, discarding anything malformed.
 *
 * A half-written or hand-edited file must not be able to hand somebody
 * ownership of a board, so every field is checked rather than trusted.
 */
export function sanitiseRooms(raw: unknown): Record<string, ClassRoom> {
  const rooms: Record<string, ClassRoom> = {};
  for (const [key, value] of Object.entries((raw ?? {}) as Record<string, unknown>)) {
    const room = value as Partial<ClassRoom>;
    const code = normaliseClassCode(room?.code ?? key);
    if (!code) continue;
    if (typeof room?.ownerId !== 'string' || !room.ownerId) continue;
    if (typeof room?.salt !== 'string' || room.salt.length < 8) continue;
    const expiresAt = Number(room?.expiresAt);
    if (!Number.isFinite(expiresAt)) continue;

    rooms[code] = {
      code,
      ownerId: room.ownerId,
      createdAt: typeof room.createdAt === 'string' ? room.createdAt : new Date().toISOString(),
      expiresAt,
      salt: room.salt,
      removed: Array.isArray(room.removed) ? room.removed.filter(id => typeof id === 'string') : [],
    };
  }
  return rooms;
}
