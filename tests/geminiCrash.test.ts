import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import type { AddressInfo } from 'net';
import { createAiCopilotRouter } from '../src/server/routes/ai-copilot';

/**
 * Express 4 does not catch errors thrown from async route handlers. An escaped
 * rejection is unhandled, and Node's default response is to terminate the
 * process, so these requests used to take down the entire server. Here each one
 * must instead come back as an error response, with no rejection left unhandled.
 *
 * GEMINI_API_KEY is removed so the rule-based fallbacks run. That is the same
 * path production takes whenever Gemini is unconfigured, erroring, or out of
 * quota, and it never reaches or bills the real API.
 */
const unhandled: unknown[] = [];
const onUnhandled = (reason: unknown) => { unhandled.push(reason); };
let base = '';
let server: ReturnType<express.Express['listen']>;

before(async () => {
  delete process.env.GEMINI_API_KEY;
  process.on('unhandledRejection', onUnhandled);
  const app = express();
  app.use(express.json());
  // A session, so the requests reach the handlers; without one they are
  // refused before any of this code runs.
  app.use(createAiCopilotRouter({ sessionUserId: () => 'usr_test' }));
  await new Promise<void>((resolve) => { server = app.listen(0, '127.0.0.1', () => resolve()); });
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});

after(() => {
  process.off('unhandledRejection', onUnhandled);
  server.closeAllConnections();
  server.close();
});

const post = (path: string, body: unknown) => fetch(`${base}${path}`, {
  method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body),
  signal: AbortSignal.timeout(5000),
});

const settle = () => new Promise((resolve) => setImmediate(resolve));

test('a partial stock gets an error response instead of killing the server', async () => {
  const res = await post('/api/gemini/analyze-stock', { stock: { name: 'x', symbol: 'X' } });
  assert.equal(res.status, 500);
  await settle();
  assert.deepEqual(unhandled, [], 'no rejection may escape the handler');
});

test('a null holdings list gets an error response instead of killing the server', async () => {
  const res = await post('/api/gemini/portfolio-audit', { holdings: null });
  assert.ok(res.status === 500 || res.status === 200, `expected a response, got ${res.status}`);
  await settle();
  assert.deepEqual(unhandled, [], 'no rejection may escape the handler');
});

test('the server keeps answering after the crafted requests', async () => {
  const res = await post('/api/gemini/chat', { message: 'Still there?' });
  assert.equal(res.status, 200);
});
