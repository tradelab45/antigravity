import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MIN_PASSWORD_LENGTH, checkPassword } from '../src/utils/passwordPolicy';

test('a long passphrase passes without a symbol in it', () => {
  assert.equal(checkPassword('monsoon ledger tuesday').ok, true);
});

test('the old eight-character minimum is no longer enough', () => {
  assert.equal(MIN_PASSWORD_LENGTH, 10);
  assert.equal(checkPassword('abcd1234').ok, false, 'eight characters used to be accepted');
});

test('the most guessed passwords are refused however long', () => {
  for (const password of ['password123', 'qwertyuiop', 'rupeerookie', 'trading123']) {
    assert.equal(checkPassword(password).ok, false, password);
  }
});

test('a straight run of characters is refused', () => {
  assert.equal(checkPassword('abcdefghij').ok, false);
  assert.equal(checkPassword('zyxwvutsrq').ok, false);
  assert.equal(checkPassword('mango12345street').ok, false, 'a run inside a longer password still counts');
});

test('a short run is not mistaken for a sequence', () => {
  assert.equal(checkPassword('mango123 street').ok, true, 'three ascending digits are ordinary');
});

test('a wall of one character is refused', () => {
  assert.equal(checkPassword('aaaaaaaaaaaa').ok, false);
});

test('the account holder own details are refused', () => {
  const identity = { fullName: 'Aarav Jain', username: 'rookie_trader', email: 'aarav@example.com' };
  assert.equal(checkPassword('rookie_trader99', identity).ok, false, 'the username');
  assert.equal(checkPassword('my aarav secret', identity).ok, false, 'the email local part');
  assert.equal(checkPassword('monsoon ledger tuesday', identity).ok, true);
});

test('a two-character alphabet is refused however long', () => {
  assert.equal(checkPassword('ababababababab').ok, false);
});

test('a password beyond the storage limit is refused', () => {
  assert.equal(checkPassword('x'.repeat(200)).ok, false);
});

test('a missing or non-string password is refused rather than throwing', () => {
  for (const value of [undefined, null, 42, {}, '']) {
    assert.equal(checkPassword(value as unknown).ok, false, String(value));
  }
});

test('every refusal says what to change', () => {
  const verdict = checkPassword('short');
  assert.equal(verdict.ok, false);
  assert.match(verdict.message, /10 characters/);
});
