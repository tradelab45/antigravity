import { test } from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import type { AddressInfo } from 'net';
import { createAdminRouter } from '../src/server/routes/admin';

/**
 * Drives the real admin router in-process. Each test builds its own app, so
 * each gets a fresh limiter and a fresh passkey read from the environment.
 */

const PASSKEY = 'a-correct-admin-passkey-for-tests-0123456789';

async function startAdminApp() {
  process.env.ADMIN_PASSKEY = PASSKEY;
  const app = express();
  app.use(express.json());
  app.use(createAdminRouter({
    loadUsers: () => [],
    saveUsers: () => {},
    loadTrades: () => [],
    toSafeUser: (u: unknown) => u,
  }));
  const server = await new Promise<ReturnType<express.Express['listen']>>((resolve) => {
    const s = app.listen(0, '127.0.0.1', () => resolve(s));
  });
  const base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  return { base, close: () => server.close() };
}

const guess = (base: string, passkey: string) => fetch(`${base}/api/admin/verify-passkey`, {
  method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ passkey }),
});

test('repeated wrong passkeys are cut off instead of guessed without limit', async () => {
  const { base, close } = await startAdminApp();
  try {
    const statuses: number[] = [];
    for (let i = 0; i < 15; i += 1) statuses.push((await guess(base, `wrong-guess-${i}`)).status);
    assert.ok(statuses.slice(0, 10).every((s) => s === 401), 'the first ten wrong guesses are simply refused');
    assert.ok(statuses.slice(10).every((s) => s === 429), `guessing is throttled after ten failures, got ${statuses.join(',')}`);
  } finally {
    close();
  }
});

test('wrong x-admin-key headers on the admin API count toward the same limit', async () => {
  const { base, close } = await startAdminApp();
  try {
    let last = 0;
    for (let i = 0; i < 12; i += 1) {
      last = (await fetch(`${base}/api/admin/users`, { headers: { 'x-admin-key': `wrong-${i}` } })).status;
    }
    assert.equal(last, 429, 'the header path cannot be used to sidestep the throttle');
  } finally {
    close();
  }
});

test('the owner using the correct passkey is never throttled', async () => {
  const { base, close } = await startAdminApp();
  try {
    for (let i = 0; i < 40; i += 1) {
      const res = await fetch(`${base}/api/admin/users`, { headers: { 'x-admin-key': PASSKEY } });
      assert.equal(res.status, 200, `request ${i + 1} by the owner should succeed`);
    }
  } finally {
    close();
  }
});

test('a rotated passkey must be long enough to resist guessing', async () => {
  const { base, close } = await startAdminApp();
  try {
    const short = await fetch(`${base}/api/admin/update-passkey`, {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ currentPasskey: PASSKEY, newPasskey: 'only-16-chars-xx' }),
    });
    assert.equal(short.status, 400, 'a 16-character passkey is rejected');
    const long = await fetch(`${base}/api/admin/update-passkey`, {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ currentPasskey: PASSKEY, newPasskey: 'a-sufficiently-long-new-passkey-value' }),
    });
    assert.equal(long.status, 200, 'a long passkey is accepted');
  } finally {
    close();
  }
});
