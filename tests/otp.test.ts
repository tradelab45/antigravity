import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  CODE_LENGTH,
  CODE_TTL_MS,
  MAX_ATTEMPTS,
  clearChallenges,
  discardChallenge,
  generateCode,
  issueChallenge,
  maskEmail,
  reissueCode,
  verifyChallenge,
} from '../src/server/otp';

beforeEach(() => clearChallenges());

test('a code is the right length and all digits', () => {
  for (let i = 0; i < 50; i += 1) {
    const code = generateCode();
    assert.equal(code.length, CODE_LENGTH);
    assert.match(code, /^\d+$/);
  }
});

test('codes are not obviously biased', () => {
  // Not a statistical test — just enough to catch a generator stuck on a digit
  // or one that never reaches 9, which is what a careless modulo produces.
  const seen = new Set<string>();
  for (let i = 0; i < 400; i += 1) {
    for (const digit of generateCode()) seen.add(digit);
  }
  assert.equal(seen.size, 10, `expected every digit to appear, saw ${[...seen].sort().join('')}`);
});

test('the right code returns the account once', () => {
  const { challengeId, code } = issueChallenge('usr_1', 'a@example.invalid', 'login');

  const first = verifyChallenge(challengeId, code);
  assert.equal(first.ok, true);
  assert.equal(first.userId, 'usr_1');
  assert.equal(first.purpose, 'login');

  const replay = verifyChallenge(challengeId, code);
  assert.equal(replay.ok, false, 'a code must not work twice');
  assert.equal(replay.reason, 'unknown');
});

test('a wrong code is refused and counted', () => {
  const { challengeId, code } = issueChallenge('usr_1', 'a@example.invalid', 'login');
  const wrong = code === '000000' ? '111111' : '000000';

  const result = verifyChallenge(challengeId, wrong);
  assert.equal(result.ok, false);
  assert.equal(result.reason, 'mismatch');
  assert.equal(result.attemptsLeft, MAX_ATTEMPTS - 1);

  // The real code still works while attempts remain.
  assert.equal(verifyChallenge(challengeId, code).ok, true);
});

test('the challenge is destroyed once attempts run out', () => {
  const { challengeId, code } = issueChallenge('usr_1', 'a@example.invalid', 'login');
  const wrong = code === '000000' ? '111111' : '000000';

  for (let i = 0; i < MAX_ATTEMPTS - 1; i += 1) {
    assert.equal(verifyChallenge(challengeId, wrong).reason, 'mismatch');
  }
  assert.equal(verifyChallenge(challengeId, wrong).reason, 'exhausted');

  const afterwards = verifyChallenge(challengeId, code);
  assert.equal(afterwards.ok, false, 'the correct code must not work after the cap');
  assert.equal(afterwards.reason, 'unknown');
});

test('a code expires', () => {
  const start = 1_000_000;
  const { challengeId, code } = issueChallenge('usr_1', 'a@example.invalid', 'login', start);

  assert.equal(verifyChallenge(challengeId, code, start + CODE_TTL_MS - 1).ok, true);

  const { challengeId: second, code: secondCode } = issueChallenge(
    'usr_1', 'a@example.invalid', 'login', start,
  );
  const expired = verifyChallenge(second, secondCode, start + CODE_TTL_MS + 1);
  assert.equal(expired.ok, false);
  assert.equal(expired.reason, 'expired');
});

test('resending replaces the old code rather than adding a second one', () => {
  const { challengeId, code } = issueChallenge('usr_1', 'a@example.invalid', 'google');
  const reissued = reissueCode(challengeId);
  assert.ok(reissued, 'a live challenge can be reissued');
  assert.equal(reissued!.email, 'a@example.invalid');

  if (reissued!.code !== code) {
    const stale = verifyChallenge(challengeId, code);
    assert.equal(stale.ok, false, 'the superseded code must stop working');
  }
  assert.equal(verifyChallenge(challengeId, reissued!.code).ok, true);
});

test('resending also clears the attempt count', () => {
  const { challengeId, code } = issueChallenge('usr_1', 'a@example.invalid', 'login');
  const wrong = code === '000000' ? '111111' : '000000';
  for (let i = 0; i < MAX_ATTEMPTS - 1; i += 1) verifyChallenge(challengeId, wrong);

  const reissued = reissueCode(challengeId);
  assert.ok(reissued);
  assert.equal(
    verifyChallenge(challengeId, wrong).attemptsLeft,
    MAX_ATTEMPTS - 1,
    'a fresh code deserves a fresh set of attempts',
  );
});

test('an expired or unknown challenge cannot be reissued', () => {
  const start = 1_000_000;
  const { challengeId } = issueChallenge('usr_1', 'a@example.invalid', 'login', start);
  assert.equal(reissueCode(challengeId, start + CODE_TTL_MS + 1), null);
  assert.equal(reissueCode('not-a-real-challenge'), null);
});

test('a cancelled sign-in cannot be completed', () => {
  const { challengeId, code } = issueChallenge('usr_1', 'a@example.invalid', 'login');
  discardChallenge(challengeId);
  assert.equal(verifyChallenge(challengeId, code).ok, false);
});

test('challenges are independent of one another', () => {
  const a = issueChallenge('usr_a', 'a@example.invalid', 'login');
  const b = issueChallenge('usr_b', 'b@example.invalid', 'login');
  assert.notEqual(a.challengeId, b.challengeId);

  const crossed = verifyChallenge(a.challengeId, b.code);
  if (a.code !== b.code) {
    assert.equal(crossed.ok, false, "one account's code must not open another");
  }
  assert.equal(verifyChallenge(b.challengeId, b.code).userId, 'usr_b');
});

test('the masked address shows the inbox without publishing it', () => {
  const masked = maskEmail('aaravtest@example.com');
  assert.ok(masked.startsWith('a'), 'the first letter helps the owner recognise it');
  assert.ok(masked.endsWith('@example.com'), 'the domain is kept');
  assert.ok(!masked.includes('aaravtest'), 'the local part is not printed');
  assert.equal(maskEmail('nonsense'), '•••');
});
