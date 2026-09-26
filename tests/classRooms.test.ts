import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_CLASS_DAYS,
  MAX_CLASS_DAYS,
  createRoom,
  extendRoom,
  generateClassCode,
  memberHandle,
  normaliseClassCode,
  roomExpired,
  sanitiseRooms,
} from '../src/server/classRooms';

test('a class code is accepted in any case and stored in one', () => {
  assert.equal(normaliseClassCode(' class-9b '), 'CLASS-9B');
  assert.equal(normaliseClassCode('9B'), null, 'too short');
  assert.equal(normaliseClassCode('CLASS 9B'), null, 'a space is not a code');
  assert.equal(normaliseClassCode('C'.repeat(17)), null, 'too long');
  assert.equal(normaliseClassCode(undefined), null);
});

test('a generated code avoids the characters people mistype for each other', () => {
  for (let i = 0; i < 200; i += 1) {
    const code = generateClassCode();
    assert.match(code, /^CLASS-[A-HJ-NP-Z2-9]{4}$/, code);
    assert.ok(normaliseClassCode(code), `${code} must be a valid code`);
  }
});

test('a new board expires, and not further out than the ceiling', () => {
  const now = 1_700_000_000_000;
  const room = createRoom('CLASS-9B', 'usr_1', DEFAULT_CLASS_DAYS, now);
  assert.equal(room.expiresAt, now + DEFAULT_CLASS_DAYS * 86_400_000);

  const greedy = createRoom('CLASS-9B', 'usr_1', 5_000, now);
  assert.equal(greedy.expiresAt, now + MAX_CLASS_DAYS * 86_400_000);

  const nonsense = createRoom('CLASS-9B', 'usr_1', -1, now);
  assert.equal(nonsense.expiresAt, now + DEFAULT_CLASS_DAYS * 86_400_000);
});

test('an expired board is expired', () => {
  const now = 1_700_000_000_000;
  const room = createRoom('CLASS-9B', 'usr_1', 1, now);
  assert.equal(roomExpired(room, now), false);
  assert.equal(roomExpired(room, now + 86_400_000), true, 'at the moment it lapses');
});

test('extending pushes the expiry out, never in', () => {
  const now = 1_700_000_000_000;
  const room = createRoom('CLASS-9B', 'usr_1', 100, now);
  assert.equal(extendRoom(room, 200, now).expiresAt, now + 200 * 86_400_000);
  assert.equal(
    extendRoom(room, 1, now).expiresAt,
    room.expiresAt,
    'a short extension must not shorten a long board',
  );
});

test('a member handle is stable, board-specific and not reversible', () => {
  const a = createRoom('CLASS-9B', 'usr_1');
  const b = createRoom('CLASS-10A', 'usr_1');

  assert.equal(memberHandle(a, 'usr_7'), memberHandle(a, 'usr_7'), 'stable within a board');
  assert.notEqual(memberHandle(a, 'usr_7'), memberHandle(b, 'usr_7'), 'different per board');
  assert.notEqual(memberHandle(a, 'usr_7'), memberHandle(a, 'usr_8'));
  assert.ok(!memberHandle(a, 'usr_7').includes('usr_7'), 'the id must not be readable from it');
});

test('a malformed registry is discarded rather than trusted', () => {
  const rooms = sanitiseRooms({
    'CLASS-9B': { code: 'CLASS-9B', ownerId: 'usr_1', salt: 'a'.repeat(16), expiresAt: 1, removed: ['x', 5] },
    'NO-OWNER': { code: 'NO-OWNER', salt: 'a'.repeat(16), expiresAt: 1 },
    'NO-SALT': { code: 'NO-SALT', ownerId: 'usr_1', expiresAt: 1 },
    'BAD EXPIRY': { code: 'BAD-EXP', ownerId: 'usr_1', salt: 'a'.repeat(16), expiresAt: 'soon' },
    'no': { ownerId: 'usr_1', salt: 'a'.repeat(16), expiresAt: 1 },
  });

  assert.deepEqual(Object.keys(rooms), ['CLASS-9B']);
  assert.deepEqual(rooms['CLASS-9B'].removed, ['x'], 'a non-string entry is dropped');
});

test('a registry survives a round trip through JSON', () => {
  const room = createRoom('CLASS-9B', 'usr_1');
  const restored = sanitiseRooms(JSON.parse(JSON.stringify({ 'CLASS-9B': room })));
  assert.deepEqual(restored['CLASS-9B'], room);
});
