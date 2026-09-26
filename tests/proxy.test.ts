import { test } from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import { configureTrustProxy } from '../src/server/proxy';
import { FALLBACK_GOOGLE_CLIENT_ID, isGoogleClientId } from '../src/config/google';

const trustOf = (env: NodeJS.ProcessEnv) => {
  const app = express();
  configureTrustProxy(app, env);
  return app.get('trust proxy fn') as (address: string, hop: number) => boolean;
};

test('a proxy on the same machine or private network is believed', () => {
  // Where a hosting provider's proxy sits. Without this, every visitor arrived
  // from the proxy's address and shared one rate limit: the whole site's.
  const trust = trustOf({});
  for (const address of ['127.0.0.1', '::1', '10.0.0.4', '172.16.5.9', '192.168.1.20', 'fe80::1']) {
    assert.equal(trust(address, 0), true, address);
  }
});

test('a caller on the public internet cannot name its own address', () => {
  // A direct connection from a public address is never a trusted proxy, so a
  // forged X-Forwarded-For from it is ignored rather than minting a new identity.
  const trust = trustOf({});
  for (const address of ['203.0.113.5', '49.36.10.11', '8.8.8.8', '2001:4860:4860::8888']) {
    assert.equal(trust(address, 0), false, address);
  }
});

test('the real client address comes through a local proxy', async () => {
  const app = express();
  configureTrustProxy(app, {});
  app.get('/ip', (req, res) => res.json({ ip: req.ip }));
  const server = app.listen(0, '127.0.0.1');
  await new Promise<void>(resolve => server.once('listening', resolve));
  try {
    const port = (server.address() as { port: number }).port;
    const answer = await fetch(`http://127.0.0.1:${port}/ip`, {
      // A client-supplied first entry, then the address the proxy appended.
      headers: { 'X-Forwarded-For': '1.2.3.4, 49.36.1.7' },
    }).then(r => r.json());
    assert.equal(answer.ip, '49.36.1.7', 'the address the proxy saw, not the one the client wrote');
  } finally {
    await new Promise<void>(resolve => server.close(() => resolve()));
  }
});

test('an explicit hop count overrides the default', () => {
  const app = express();
  assert.equal(configureTrustProxy(app, { TRUST_PROXY_HOPS: '2' }), 2);
  assert.equal(configureTrustProxy(app, { TRUST_PROXY_HOPS: 'nonsense' }), 'loopback, linklocal, uniquelocal');
  assert.equal(configureTrustProxy(app, { TRUST_PROXY_HOPS: '50' }), 'loopback, linklocal, uniquelocal', 'an absurd count is ignored');
});

test('the browser and the server share one Google client fallback', () => {
  assert.equal(isGoogleClientId(FALLBACK_GOOGLE_CLIENT_ID), true);
  assert.equal(isGoogleClientId('YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com'), false);
  assert.equal(isGoogleClientId('not-a-client-id'), false);
  assert.equal(isGoogleClientId(undefined), false);
});
