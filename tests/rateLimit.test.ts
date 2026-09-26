import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { clearAll, clientKey, consume, reset } from '../src/server/rateLimit';

beforeEach(() => clearAll());

const rule = { limit: 3, windowMs: 60_000 };

test('attempts are allowed up to the limit and refused after it', () => {
  const now = 1_000_000;
  assert.equal(consume('k', rule, now).allowed, true);
  assert.equal(consume('k', rule, now).allowed, true);
  assert.equal(consume('k', rule, now).allowed, true);
  assert.equal(consume('k', rule, now).allowed, false, 'the fourth attempt is over the limit');
});

test('remaining counts down to zero', () => {
  const now = 1_000_000;
  assert.equal(consume('k', rule, now).remaining, 2);
  assert.equal(consume('k', rule, now).remaining, 1);
  assert.equal(consume('k', rule, now).remaining, 0);
});

test('the window reopens once it has passed', () => {
  const start = 1_000_000;
  for (let i = 0; i < 4; i += 1) consume('k', rule, start);
  assert.equal(consume('k', rule, start).allowed, false);
  assert.equal(
    consume('k', rule, start + rule.windowMs + 1).allowed,
    true,
    'a fresh window starts once the old one expires',
  );
});

test('attempts made while blocked keep the key blocked', () => {
  const start = 1_000_000;
  for (let i = 0; i < 3; i += 1) consume('k', rule, start);
  // Hammering inside the window must not roll the window forward or let one
  // through; it just stays refused until the original window ends.
  for (let i = 0; i < 20; i += 1) {
    assert.equal(consume('k', rule, start + 1000).allowed, false);
  }
  assert.equal(consume('k', rule, start + rule.windowMs + 1).allowed, true);
});

test('keys are independent', () => {
  const now = 1_000_000;
  for (let i = 0; i < 4; i += 1) consume('a', rule, now);
  assert.equal(consume('a', rule, now).allowed, false);
  assert.equal(consume('b', rule, now).allowed, true, 'one blocked key must not block another');
});

test('a success clears the counter', () => {
  const now = 1_000_000;
  consume('k', rule, now);
  consume('k', rule, now);
  reset('k');
  assert.equal(consume('k', rule, now).remaining, 2, 'the window starts over after a reset');
});

test('retryAfter is reported in whole seconds and never zero', () => {
  const start = 1_000_000;
  for (let i = 0; i < 4; i += 1) consume('k', rule, start);
  const verdict = consume('k', rule, start + rule.windowMs - 10);
  assert.equal(verdict.allowed, false);
  assert.ok(verdict.retryAfterSeconds >= 1, 'Retry-After of 0 would invite an immediate retry');
});

test('IPv4-mapped IPv6 addresses collapse to one key', () => {
  assert.equal(clientKey('::ffff:203.0.113.5'), '203.0.113.5');
  assert.equal(clientKey('203.0.113.5'), '203.0.113.5');
  assert.equal(clientKey(undefined), 'unknown');
});
