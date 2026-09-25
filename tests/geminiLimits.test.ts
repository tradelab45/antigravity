import { test, before } from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import type { AddressInfo } from 'net';
import { createAiCopilotRouter, clampHistory } from '../src/server/routes/ai-copilot';

/**
 * Drives the real Gemini routes in-process. GEMINI_API_KEY is removed first, so
 * every request takes the rule-based fallback: the tests exercise the limits
 * and never reach, or bill, the real API.
 */
before(() => { delete process.env.GEMINI_API_KEY; });

async function startApp() {
  const app = express();
  app.use(express.json({ limit: '1mb' }));
  app.use(createAiCopilotRouter({ sessionUserId: (req) => req.get('x-test-session') || null }));
  const server = await new Promise<ReturnType<express.Express['listen']>>((resolve) => {
    const s = app.listen(0, '127.0.0.1', () => resolve(s));
  });
  const base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  const chat = (body: unknown, session?: string) => fetch(`${base}/api/gemini/chat`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...(session ? { 'x-test-session': session } : {}) },
    body: JSON.stringify(body),
  });
  return { base, chat, close: () => { server.closeAllConnections(); server.close(); } };
}

/** A complete stock, shaped like the ones the app sends. */
const fullStock = {
  name: 'Reliance Industries', symbol: 'RELIANCE', price: 1226, high52: 1608, low52: 1115,
  peRatio: 22.5, industryPe: 18.1, marketCapCr: 1659000, dividendYield: 0.4, popularBrands: ['Jio', 'Reliance Retail'],
};

test('an anonymous caller cannot spend the API key without limit', async () => {
  const { chat, close } = await startApp();
  try {
    const statuses: number[] = [];
    for (let i = 0; i < 32; i += 1) statuses.push((await chat({ message: `q${i}` })).status);
    assert.ok(statuses.slice(0, 30).every((s) => s === 200), 'the anonymous allowance is served');
    assert.equal(statuses[31], 429, `anonymous use is throttled, got ${statuses.join(',')}`);
  } finally { close(); }
});

test('each signed-in student has their own allowance, even on a shared school IP', async () => {
  const { chat, close } = await startApp();
  try {
    let alice = 0;
    for (let i = 0; i < 61; i += 1) alice = (await chat({ message: `q${i}` }, 'usr_alice')).status;
    assert.equal(alice, 429, 'one student is throttled after their allowance');
    assert.equal((await chat({ message: 'hi' }, 'usr_bob')).status, 200, 'a classmate on the same IP is unaffected');
    assert.equal((await chat({ message: 'hi' })).status, 200, 'the anonymous bucket is separate too');
  } finally { close(); }
});

test('the limit covers every Gemini endpoint, not just chat', async () => {
  const { base, close } = await startApp();
  try {
    let last = 0;
    for (let i = 0; i < 31; i += 1) {
      last = (await fetch(`${base}/api/gemini/analyze-stock`, {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ stock: fullStock }),
      })).status;
    }
    assert.equal(last, 429);
  } finally { close(); }
});

test('oversized prompts are refused before they reach the model', async () => {
  const { base, chat, close } = await startApp();
  try {
    assert.equal((await chat({ message: 'x'.repeat(4001) }, 'usr_alice')).status, 400);
    assert.equal((await chat({ message: '' }, 'usr_alice')).status, 400);
    assert.equal((await chat({ message: 'hi', context: { blob: 'x'.repeat(30000) } }, 'usr_alice')).status, 400);
    const audit = await fetch(`${base}/api/gemini/portfolio-audit`, {
      method: 'POST', headers: { 'content-type': 'application/json', 'x-test-session': 'usr_alice' },
      body: JSON.stringify({ holdings: Array.from({ length: 5000 }, (_, i) => ({ symbol: `S${i}`, qty: 1 })) }),
    });
    assert.equal(audit.status, 400);
    const stock = await fetch(`${base}/api/gemini/analyze-stock`, {
      method: 'POST', headers: { 'content-type': 'application/json', 'x-test-session': 'usr_alice' },
      body: JSON.stringify({ stock: { name: 'x'.repeat(10000), symbol: 'X' } }),
    });
    assert.equal(stock.status, 400);
  } finally { close(); }
});

test('ordinary requests still get their answer', async () => {
  const { chat, close } = await startApp();
  try {
    const res = await chat({ message: 'What is a P/E ratio?', history: [{ id: '1', sender: 'user', text: 'hello' }] }, 'usr_alice');
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.ok(typeof body.text === 'string' || typeof body.reply === 'string' || typeof body.response === 'string',
      `a reply comes back: ${JSON.stringify(body).slice(0, 120)}`);
  } finally { close(); }
});

test('history is trimmed to recent, well-formed turns', () => {
  const long = Array.from({ length: 50 }, (_, i) => ({ id: String(i), sender: i % 2 ? 'ai' : 'user', text: `turn ${i}` }));
  const kept = clampHistory(long);
  assert.equal(kept.length, 20, 'only the last twenty turns are sent');
  assert.equal(kept[kept.length - 1].text, 'turn 49', 'the most recent turns are the ones kept');
  assert.deepEqual(clampHistory('not an array'), []);
  assert.deepEqual(clampHistory([{ sender: 'user', text: 42 }, null, { sender: 'user', text: 'ok' }]),
    [{ sender: 'user', text: 'ok' }]);
  assert.equal(clampHistory([{ sender: 'user', text: 'y'.repeat(9000) }])[0].text.length, 4000, 'each turn is capped');
});
