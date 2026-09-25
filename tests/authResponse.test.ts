import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isAuthApiRejection, validateUsername, validateEmail } from '../src/modules/auth/authResponse';

test('a static host 404 is not a rejection, so the offline fallback can run', () => {
  assert.equal(isAuthApiRejection(404, 'text/html'), false);
  assert.equal(isAuthApiRejection(405, 'text/html'), false);
  assert.equal(isAuthApiRejection(503, null), false);
});

test('a real API validation error is a rejection', () => {
  assert.equal(isAuthApiRejection(400, 'application/json; charset=utf-8'), true);
  assert.equal(isAuthApiRejection(500, 'application/json'), true);
});

test('rate limiting is always a rejection', () => {
  assert.equal(isAuthApiRejection(429, 'text/html'), true);
});

test('username rule matches the server regex', () => {
  assert.equal(validateUsername('rookie_trader'), null);
  assert.equal(validateUsername('Rookie_Trader'), null, 'lowercased before testing');
  assert.notEqual(validateUsername('ab'), null, 'too short');
  assert.notEqual(validateUsername('aarav.jain'), null, 'dot is rejected by the server');
  assert.notEqual(validateUsername('aarav jain'), null, 'space is rejected by the server');
});

test('email rule requires a TLD like the server does', () => {
  assert.equal(validateEmail('a@b.com'), null);
  assert.notEqual(validateEmail('a@b'), null, 'server requires a dot in the domain');
});
