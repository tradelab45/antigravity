import { test } from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import type { AddressInfo } from 'net';
import { asyncRoute } from '../src/server/asyncRoute';

/**
 * Express 4 does not catch errors thrown from async route handlers. An escaped
 * rejection goes unhandled, and Node's default response to that is to end the
 * process. Each case below would have taken a real server down without the
 * wrapper. With it, the request gets a 500 and the process carries on.
 */

async function serve(handler: Parameters<typeof asyncRoute>[0], failureMessage?: string) {
  const unhandled: unknown[] = [];
  const onUnhandled = (reason: unknown) => { unhandled.push(reason); };
  process.on('unhandledRejection', onUnhandled);
  const app = express();
  app.get('/probe', asyncRoute(handler, failureMessage));
  app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    res.status(599).end(String((err as Error)?.message ?? err));
  });
  const server = await new Promise<ReturnType<express.Express['listen']>>((resolve) => {
    const s = app.listen(0, '127.0.0.1', () => resolve(s));
  });
  const url = `http://127.0.0.1:${(server.address() as AddressInfo).port}/probe`;
  const res = await fetch(url, { signal: AbortSignal.timeout(3000) });
  const body = await res.text();
  await new Promise((resolve) => setImmediate(resolve));
  process.off('unhandledRejection', onUnhandled);
  server.closeAllConnections();
  server.close();
  return { status: res.status, body, unhandled };
}

test('a handler that throws gets a 500 and no rejection escapes', async () => {
  const r = await serve(async () => { throw new TypeError("Cannot read properties of undefined (reading 'toLocaleString')"); });
  assert.equal(r.status, 500);
  assert.deepEqual(r.unhandled, []);
});

test('a throw from inside the handler\'s own catch block is caught too', async () => {
  // Every route here ends in `catch (err) { … err.message … }`. If anything
  // rejects with null, that line throws inside the catch, which is exactly how
  // the /api/gemini/analyze-stock crash happened.
  const r = await serve(async (_req, res) => {
    try {
      await Promise.reject(null);
    } catch (err: any) {
      res.status(500).json({ message: err.message || 'failed' });
    }
  });
  assert.equal(r.status, 500);
  assert.deepEqual(r.unhandled, []);
});

test('the error body speaks both of the server\'s error envelopes', async () => {
  const r = await serve(async () => { throw new Error('internal detail'); });
  const json = JSON.parse(r.body);
  assert.equal(json.success, false);
  assert.equal(typeof json.message, 'string');
  assert.equal(json.error, json.message);
});

test('internal error details never reach the client', async () => {
  const r = await serve(async () => { throw new Error('ECONNREFUSED 10.0.0.5:5432 password=hunter2'); });
  assert.doesNotMatch(r.body, /ECONNREFUSED|hunter2|10\.0\.0\.5/);
});

test('a route can supply its own user-facing failure message', async () => {
  const r = await serve(async () => { throw new Error('x'); }, 'Chanakya could not answer that request.');
  assert.equal(JSON.parse(r.body).message, 'Chanakya could not answer that request.');
});

test('a failure after the response has started is handed to Express, not written twice', async () => {
  const r = await serve(async (_req, res) => {
    res.status(200).write('partial');
    throw new Error('late failure');
  });
  assert.equal(r.status, 200, 'the status already sent stands');
  assert.deepEqual(r.unhandled, []);
});

test('a successful handler is left completely alone', async () => {
  const r = await serve(async (_req, res) => { res.status(201).json({ ok: true }); });
  assert.equal(r.status, 201);
  assert.deepEqual(JSON.parse(r.body), { ok: true });
});
