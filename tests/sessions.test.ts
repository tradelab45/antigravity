import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  SESSION_TTL_MS,
  clearSessions,
  issueSession,
  readSession,
  revokeAllSessionsForUser,
  revokeSession,
  rotateSessionsForUser,
} from '../src/server/sessions';

beforeEach(() => clearSessions());

test('a freshly issued token reads back as its own user', () => {
  const { token, expiresAt } = issueSession('usr_1');
  const claims = readSession(token);
  assert.ok(claims);
  assert.equal(claims!.userId, 'usr_1');
  assert.equal(claims!.expiresAt, expiresAt);
});

test('the expiry is the advertised lifetime', () => {
  const now = 1_700_000_000_000;
  const { expiresAt } = issueSession('usr_1', now);
  assert.equal(expiresAt, now + SESSION_TTL_MS);
});

test('an expired token is refused', () => {
  const now = 1_700_000_000_000;
  const { token } = issueSession('usr_1', now);
  assert.ok(readSession(token, now + SESSION_TTL_MS - 1));
  assert.equal(readSession(token, now + SESSION_TTL_MS + 1), null);
});

test('editing the expiry to extend the session is refused', () => {
  // This is what the old client-side model could not stop: the browser owned
  // the timestamp, so it could simply be moved.
  const now = 1_700_000_000_000;
  const { token } = issueSession('usr_1', now);
  const parts = token.split('.');
  parts[2] = String(now + SESSION_TTL_MS * 100);
  assert.equal(readSession(parts.join('.'), now), null, 'a re-dated token must not verify');
});

test('swapping in another user id is refused', () => {
  const { token } = issueSession('usr_victim');
  const parts = token.split('.');
  parts[0] = Buffer.from('usr_attacker', 'utf8').toString('base64url');
  assert.equal(readSession(parts.join('.')), null, 'the signature covers the user id');
});

test('a token signed with the wrong key is refused', () => {
  const { token } = issueSession('usr_1');
  const parts = token.split('.');
  // Same length, different content: the comparison must not accept it.
  parts[4] = parts[4].split('').reverse().join('');
  const forged = parts.join('.');
  if (forged !== token) {
    assert.equal(readSession(forged), null);
  }
});

test('malformed tokens are refused rather than throwing', () => {
  for (const bad of ['', 'x', 'a.b.c', 'a.b.c.d', 'a.b.c.d.e.f', null, undefined, 42, {}]) {
    assert.equal(readSession(bad as unknown), null, `rejected: ${String(bad)}`);
  }
});

test('an absurdly long token is refused without work', () => {
  assert.equal(readSession('a.'.repeat(5000)), null);
});

test('signing out revokes that session and no other', () => {
  const first = issueSession('usr_1');
  const second = issueSession('usr_1');

  revokeSession(first.token);
  assert.equal(readSession(first.token), null, 'the signed-out session must stop working');
  assert.ok(readSession(second.token), 'the other device stays signed in');
});

test('signing out everywhere revokes every session for that account', () => {
  const now = 1_700_000_000_000;
  const phone = issueSession('usr_1', now);
  const laptop = issueSession('usr_1', now);
  const someoneElse = issueSession('usr_2', now);

  revokeAllSessionsForUser('usr_1', now + 1);

  assert.equal(readSession(phone.token, now + 2), null);
  assert.equal(readSession(laptop.token, now + 2), null);
  assert.ok(readSession(someoneElse.token, now + 2), 'another account is untouched');
});

test('a session issued after a revoke-all still works', () => {
  const now = 1_700_000_000_000;
  revokeAllSessionsForUser('usr_1', now);
  const fresh = issueSession('usr_1', now + 1000);
  assert.ok(readSession(fresh.token, now + 2000), 'signing back in must work after signing out everywhere');
});

test('two tokens for the same user are distinguishable', () => {
  const a = issueSession('usr_1');
  const b = issueSession('usr_1');
  assert.notEqual(a.token, b.token, 'each session needs its own id so one can be revoked alone');
});

test('a user id containing a separator survives a round trip', () => {
  // The token is dot-delimited, so anything dot-like in an id has to be encoded.
  const { token } = issueSession('usr.with.dots');
  const claims = readSession(token);
  assert.ok(claims);
  assert.equal(claims!.userId, 'usr.with.dots');
});

test('rotating drops every other device and keeps the replacement', () => {
  const now = 1_700_000_000_000;
  const phone = issueSession('usr_1', now);
  const laptop = issueSession('usr_1', now);

  const replacement = rotateSessionsForUser('usr_1', now);

  assert.equal(readSession(phone.token, now + 10), null, 'the other devices go');
  assert.equal(readSession(laptop.token, now + 10), null);
  assert.ok(
    readSession(replacement.token, now + 10),
    'the browser that changed the password must not sign itself out',
  );
});

test('rotating twice in the same millisecond still leaves the newest alive', () => {
  const now = 1_700_000_000_000;
  const first = rotateSessionsForUser('usr_1', now);
  const second = rotateSessionsForUser('usr_1', now);

  assert.equal(readSession(first.token, now + 10), null);
  assert.ok(readSession(second.token, now + 10));
});

test('rotating one account leaves another alone', () => {
  const now = 1_700_000_000_000;
  const other = issueSession('usr_2', now);
  rotateSessionsForUser('usr_1', now);
  assert.ok(readSession(other.token, now + 10));
});

test('without SESSION_SECRET, separate processes and restarts still agree on sessions', async () => {
  // A host that runs more than one process, or restarts, used to give each
  // process its own random secret: a session signed by one was refused by the
  // next, and a learner who had just signed in was signed straight back out.
  const { execFileSync } = await import('node:child_process');
  const { mkdtempSync, rmSync, statSync } = await import('node:fs');
  const os = await import('node:os');
  const path = await import('node:path');

  const modulePath = path.resolve('src/server/sessions.ts');
  const directory = mkdtempSync(path.join(os.tmpdir(), 'rr-sessions-'));
  const env = { ...process.env };
  delete env.SESSION_SECRET;
  const { pathToFileURL } = await import('node:url');
  // The loader by absolute URL: the child runs in an empty directory with no
  // node_modules of its own.
  const tsxLoader = pathToFileURL(path.resolve('node_modules/tsx/dist/loader.mjs')).href;
  const run = (code: string) =>
    execFileSync(process.execPath, ['--import', tsxLoader, '--input-type=module', '-e', code], {
      cwd: directory, env, encoding: 'utf-8',
    }).trim();
  try {
    const token = run(`import { issueSession } from ${JSON.stringify(modulePath)}; console.log(issueSession('usr_restart').token);`);
    const claimed = run(`import { readSession } from ${JSON.stringify(modulePath)}; console.log(readSession(${JSON.stringify(token)})?.userId ?? 'refused');`);
    assert.equal(claimed, 'usr_restart', 'a second process accepts the first one\'s session');
    assert.equal(statSync(path.join(directory, 'data', 'session-secret')).mode & 0o777, 0o600, 'owner-only');
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});
