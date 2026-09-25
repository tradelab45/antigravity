import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import type { AddressInfo } from 'net';
import { mkdtempSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { createAuthRouter, type AuthUserRecord } from '../src/server/routes/auth';

/**
 * Drives the real auth router in-process. Only Google's tokeninfo endpoint is
 * stubbed, so the verification and linking logic under test is the shipped code.
 */

const CLIENT_ID = 'test-client.apps.googleusercontent.com';

let users: AuthUserRecord[] = [];
const revoked: string[] = [];
let baseUrl = '';
let server: ReturnType<express.Express['listen']>;
const realFetch = globalThis.fetch;
let googleClaims: Record<string, unknown> = {};

const originalCwd = process.cwd();

before(async () => {
  // The router re-reads GOOGLE_CLIENT_ID from ./.env on every request, so run
  // from an empty directory: the developer's real .env must not decide the test.
  process.chdir(mkdtempSync(join(tmpdir(), 'rr-auth-test-')));
  process.env.GOOGLE_CLIENT_ID = CLIENT_ID;
  const app = express();
  app.use(express.json());
  app.use(createAuthRouter({
    loadUsers: () => users,
    saveUsers: (next) => { users = next; },
    toSafeUser: (u: AuthUserRecord) => { const { passwordHash, password, ...safe } = u; return safe; },
    hashPassword: (p) => `hashed:${p}`,
    verifyPassword: (p, u) => u.passwordHash === `hashed:${p}`,
    issueSession: () => {},
    revokeUserSessions: (userId) => { revoked.push(userId); },
  }));
  await new Promise<void>((resolve) => { server = app.listen(0, '127.0.0.1', () => resolve()); });
  baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;

  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    if (url.startsWith('https://oauth2.googleapis.com/tokeninfo')) {
      return new Response(JSON.stringify(googleClaims), { status: 200, headers: { 'content-type': 'application/json' } });
    }
    return realFetch(input, init);
  }) as typeof fetch;
});

after(() => {
  globalThis.fetch = realFetch;
  server.close();
  process.chdir(originalCwd);
});

const claimsFor = (email: string, sub: string) => ({
  sub, email, email_verified: 'true', name: 'Real Owner', aud: CLIENT_ID,
  iss: 'https://accounts.google.com', exp: String(Math.floor(Date.now() / 1000) + 3600),
});

const post = (path: string, body: unknown) => realFetch(`${baseUrl}${path}`, {
  method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body),
});

test('an attacker who pre-registers a victim\'s email loses the account when the victim signs in with Google', async () => {
  users = [];
  // 1. Attacker signs up with the victim's address. Nothing verifies they own it.
  const signup = await post('/api/auth/signup', {
    fullName: 'Squatter', email: 'victim@example.com', username: 'squatter', password: 'attacker-pass-1',
  });
  assert.equal(signup.status, 200);
  const squatted = users.find((u) => u.email === 'victim@example.com')!;
  assert.ok(squatted.passwordHash, 'the squatted account starts with the attacker\'s password');

  // 2. The real owner signs in with Google, which does verify the address.
  googleClaims = claimsFor('victim@example.com', 'google-sub-victim');
  const google = await post('/api/auth/google', { credential: 'token' });
  assert.equal(google.status, 200);

  // 3. The attacker's password no longer opens the account...
  const attackerLogin = await post('/api/auth/login', { identifier: 'victim@example.com', password: 'attacker-pass-1' });
  assert.equal(attackerLogin.status, 401, 'the pre-registered password must stop working once Google verifies the owner');

  // 4. ...and any session the attacker already held is revoked.
  assert.deepEqual(revoked, [squatted.id]);
});

test('an account that is already linked to Google keeps working and is not revoked again', async () => {
  users = [];
  revoked.length = 0;
  googleClaims = claimsFor('owner@example.com', 'google-sub-owner');
  const first = await post('/api/auth/google', { credential: 'token' });
  assert.equal(first.status, 200);
  const second = await post('/api/auth/google', { credential: 'token' });
  assert.equal(second.status, 200);
  assert.equal(users.length, 1, 'the second sign-in reuses the same account');
  assert.deepEqual(revoked, [], 'nothing to revoke when no password was ever set');
});

test('signup keeps only age groups a real form offers', async () => {
  users = [];
  await post('/api/auth/signup', {
    fullName: 'Legit', email: 'legit@example.com', username: 'legit_user', password: 'password-123',
    ageGroup: '19-24 (College/Undergrad)',
  });
  await post('/api/auth/signup', {
    fullName: 'Modal', email: 'modal@example.com', username: 'modal_user', password: 'password-123',
    ageGroup: '22+ (Young Professional)',
  });
  await post('/api/auth/signup', {
    fullName: 'Crafted', email: 'crafted@example.com', username: 'crafted_user', password: 'password-123',
    ageGroup: '=HYPERLINK("http://evil.example","x")',
  });
  assert.equal(users.find((u) => u.username === 'legit_user')!.ageGroup, '19-24 (College/Undergrad)');
  assert.equal(users.find((u) => u.username === 'modal_user')!.ageGroup, '22+ (Young Professional)');
  assert.equal(users.find((u) => u.username === 'crafted_user')!.ageGroup, '13-17 (Teen)', 'arbitrary text falls back to the default');
});
