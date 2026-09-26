import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import { mkdtempSync, mkdirSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { chromium, type Browser, type Page } from 'playwright';
import type { Server } from 'node:http';
import { createAcademyService } from '../../src/modules/academy/server/academyService';
import { SESSION_COOKIE, issueSession, readSession } from '../../src/server/sessions';
import { EXAM_LENGTH, getStageExam } from '../../src/modules/academy/data/stageExams';
import { seedSession, auditContrast } from './contrastAudit';

let server: Server, browser: Browser, base: string, directory: string;
const userId = 'contrast-audit-user';
const root = process.cwd();
before(async () => {
  directory = mkdtempSync(path.join(os.tmpdir(), 'rr-academy-browser-'));
  mkdirSync(path.join(root, 'test-results'), { recursive: true });
  // The Academy authenticates through the app's signed session, as server.ts wires it.
  const service = createAcademyService(path.join(directory, 'academy.json'), (req) => {
    const raw = req.headers.cookie?.split(';').map(part => part.trim()).find(part => part.startsWith(`${SESSION_COOKIE}=`));
    return readSession(raw ? decodeURIComponent(raw.slice(SESSION_COOKIE.length + 1)) : null)?.userId ?? null;
  });
  const app = express(); app.use(express.json());
  app.post('/__test/session', (_req, res) => {
    res.cookie(SESSION_COOKIE, issueSession(userId).token, { httpOnly: true, sameSite: 'lax', path: '/' });
    res.json({ ok: true });
  });
  app.use('/api/academy', service.router);
  app.post('/api/auth/login', (_req, res) => res.status(429).json({ message: 'Too many attempts. Please wait.' }));
  app.use('/api', (_req, res) => res.status(503).json({ success: false, message: 'Market API disabled in browser tests.' }));
  app.use(express.static(path.join(root, 'dist')));
  app.get('*', (_req, res) => res.sendFile(path.join(root, 'dist/index.html')));
  server = app.listen(0, '127.0.0.1');
  await new Promise<void>(resolve => server.once('listening', resolve));
  base = `http://127.0.0.1:${(server.address() as { port: number }).port}`;
  browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
});
after(async () => {
  await browser?.close();
  if (server) await new Promise<void>(resolve => server.close(() => resolve()));
  if (directory) rmSync(directory, { recursive: true, force: true });
});
async function learner(width = 1280, theme: 'light' | 'dark' = 'light') {
  const page = await browser.newPage({ viewport: { width, height: 900 } });
  await seedSession(page, theme);
  return page;
}
async function noOverflow(page: Page) {
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), true, 'Page should not overflow horizontally');
}

test('Hindi lessons and knowledge checks persist, and Home resumes the exact lesson', { timeout: 45000 }, async () => {
  const page = await learner(390);
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  try {
    await page.goto(`${base}/?view=academy&lesson=lesson-2&stage=beginner`);
    await page.getByRole('button', { name: 'हिंदी', exact: true }).click();
    await page.getByRole('heading', { name: 'मूल्यांकन: P/E, EPS, P/B और PEG', exact: true }).waitFor();
    assert.ok(await page.getByText('Alpha: P/E 10 और PEG लगभग 0.67 है', { exact: true }).isVisible());
    await noOverflow(page);
    await page.getByRole('heading', { name: 'मूल्यांकन: P/E, EPS, P/B और PEG', exact: true }).scrollIntoViewIfNeeded();
    await page.screenshot({ path: path.join(root, 'test-results/academy-hindi-mobile.png') });
    await page.reload();
    await page.getByRole('heading', { name: 'मूल्यांकन: P/E, EPS, P/B और PEG', exact: true }).waitFor();
    await page.goto(`${base}/?view=home`);
    const resume = page.getByRole('region', { name: 'Resume learning' });
    await resume.waitFor();
    assert.match(await resume.innerText(), /मूल्यांकन/);
    assert.match((await resume.getByRole('link').getAttribute('href'))!, /lesson=lesson-2/);
    await resume.getByRole('link').click();
    await page.getByRole('heading', { name: 'मूल्यांकन: P/E, EPS, P/B और PEG', exact: true }).waitFor();
    assert.deepEqual(errors, []);
  } finally { await page.close(); }
});

test('failed and passed exams create one dated record each and export a certificate', { timeout: 60000 }, async () => {
  const page = await learner();
  await page.addInitScript(() => localStorage.setItem('rr_lessons:contrast-audit-user', JSON.stringify(['lesson-1', 'lesson-2'])));
  try {
    await page.goto(`${base}/?view=academy`);
    await page.getByRole('button', { name: /Stage Exam/ }).click();
    const exam = getStageExam('beginner')!;
    for (let attemptIndex = 0; attemptIndex < 2; attemptIndex++) {
      // A paper is EXAM_LENGTH questions drawn from a larger bank and shuffled,
      // so answer what is actually on the page rather than the bank in order.
      await page.getByRole('button', { name: 'Submit paper' }).waitFor();
      // Each question's own line, minus its number, matched exactly: one
      // question's text can appear inside another's, so a substring match
      // finds questions that are not on the paper.
      const shown = new Set((await page.locator('ol > li > p:first-child').allTextContents())
        .map(text => text.replace(/^\s*\d+\.\s*/, '').trim()));
      const paper = exam.questions.filter(question => shown.has(question.question));
      assert.equal(paper.length, EXAM_LENGTH, 'the paper on screen is one full paper');
      for (let i = 0; i < paper.length; i++) {
        const question = paper[i];
        const answer = attemptIndex === 0 && i < 7 ? (question.correctIndex + 1) % 4 : question.correctIndex;
        await page.locator('li').filter({ hasText: question.question }).getByRole('button', { name: question.options[answer], exact: true }).click();
      }
      await page.getByRole('button', { name: 'Submit paper' }).click();
      await page.getByText(attemptIndex === 0 ? /13 out of 20 correct/ : /20 out of 20 correct/).waitFor();
      if (!attemptIndex) await page.getByRole('button', { name: 'Retake the exam' }).click();
    }
    await page.getByRole('button', { name: 'Exam History', exact: true }).click();
    const history = page.getByRole('region', { name: 'Exam history', exact: true });
    assert.equal(await history.locator('tbody tr').count(), 2);
    // The trend is said in words, from the attempts it plots, and the drawing
    // holds nothing a keyboard can land on.
    const chart = await history.locator('figure[role="group"]').evaluate(node => ({
      summary: node.ownerDocument.getElementById(node.getAttribute('aria-labelledby') || '')?.textContent || '',
      trapped: node.querySelectorAll('[aria-hidden="true"] a[href], [aria-hidden="true"] button, [aria-hidden="true"] [tabindex]:not([tabindex="-1"])').length,
    }));
    assert.match(chart.summary, /13 to 20, up 7/, `the chart should say what the scores did: "${chart.summary}"`);
    assert.equal(chart.trapped, 0, 'nothing focusable inside the hidden drawing');
    assert.equal(await history.getByRole('button', { name: 'Download certificate' }).count(), 1);
    const download = page.waitForEvent('download');
    await history.getByRole('button', { name: 'Download certificate' }).click();
    const file = await download; assert.match(file.suggestedFilename(), /beginner-certificate.png/);
    await file.saveAs(path.join(root, 'test-results/certificate.png'));
    assert.deepEqual(await auditContrast(page), []);
    await history.scrollIntoViewIfNeeded();
    await page.screenshot({ path: path.join(root, 'test-results/exam-history-desktop.png') });
    await page.reload();
    await page.getByRole('button', { name: 'Exam History', exact: true }).click();
    assert.equal(await page.getByRole('region', { name: 'Exam history', exact: true }).locator('tbody tr').count(), 2);
  } finally { await page.close(); }
});

test('a real session can join a group, view rankings and leave', { timeout: 30000 }, async () => {
  const page = await learner(390, 'dark');
  try {
    await page.context().request.post(`${base}/__test/session`);
    await page.goto(`${base}/?view=academy`);
    await page.getByRole('button', { name: 'School / College', exact: true }).click();
    await page.getByLabel('School / college name', { exact: true }).fill('Example School');
    await page.getByLabel('Nickname', { exact: true }).fill('LearningRunner');
    await page.getByLabel('Private group code', { exact: true }).fill('test-class-2026');
    await page.getByRole('button', { name: 'Join & share my scores' }).click();
    const region = page.getByRole('region', { name: 'School and college leaderboard' });
    await region.getByText('LearningRunner (you)', { exact: true }).waitFor();
    assert.match(await region.innerText(), /Your rank: 1/);
    await noOverflow(page);
    assert.deepEqual(await auditContrast(page), []);
    await region.scrollIntoViewIfNeeded();
    await page.screenshot({ path: path.join(root, 'test-results/leaderboard-mobile-dark.png') });
    await page.getByRole('button', { name: 'Leave group' }).click();
    await page.getByRole('button', { name: 'Join & share my scores' }).waitFor();
  } finally { await page.close(); }
});

test('PWA caches lessons for offline reload and remembers install prompts between views', { timeout: 60000 }, async () => {
  const page = await learner();
  try {
    await page.goto(`${base}/?view=academy`);
    await page.getByRole('button', { name: 'English', exact: true }).waitFor();
    await page.evaluate(() => {
      const event = Object.assign(new Event('beforeinstallprompt'), { prompt: async () => {}, userChoice: Promise.resolve({ outcome: 'dismissed' }) });
      window.dispatchEvent(event);
    });
    await page.getByRole('button', { name: 'Home', exact: true }).first().click();
    await page.getByRole('button', { name: 'Install app', exact: true }).click();
    await page.getByText('Installation dismissed.', { exact: true }).waitFor();
    assert.equal(await page.getByRole('button', { name: 'Install app', exact: true }).count(), 0);
    await page.getByText('Academy lessons ready offline on this device.', { exact: true }).waitFor({ timeout: 30000 });
    const cached = await page.evaluate(async () => {
      const keys = await caches.keys();
      const cache = await caches.open(keys.find(key => key.startsWith('rupeerookie-'))!);
      return (await cache.keys()).map(request => new URL(request.url).pathname);
    });
    assert.ok(cached.some(url => /InvestorAcademy.*\.js/.test(url)));
    assert.ok(cached.every(url => !url.startsWith('/api/')));
    await page.context().setOffline(true);
    await page.goto(`${base}/?view=academy&lesson=lesson-1`);
    await page.getByRole('heading', { name: 'The Stock Market Playground: What is a Share & Equity?', exact: true }).waitFor();
    await page.getByRole('button', { name: 'हिंदी', exact: true }).click();
    await page.getByRole('heading', { name: 'शेयर बाज़ार: शेयर और हिस्सेदारी क्या हैं?', exact: true }).waitFor();
    await page.screenshot({ path: path.join(root, 'test-results/academy-offline.png') });
  } finally { await page.close(); }
});

test('throttled login cannot use the offline-demo fallback', { timeout: 30000 }, async () => {
  const page = await browser.newPage();
  try {
    await page.goto(base + '/?classic=true');
    await page.getByRole('button', { name: 'Sign in', exact: true }).first().click();
    await page.locator('#login-identifier').fill('rookie_trader');
    await page.locator('#login-password').fill('test-only-password');
    await page.locator('#login-submit-btn').click();
    await page.getByText('Too many attempts. Please wait.', { exact: true }).waitFor();
    assert.equal(await page.evaluate(() => localStorage.getItem('rr_current_user')), null);
  } finally { await page.close(); }
});

test('signed-out sandbox has the badge and remains interactive', { timeout: 20000 }, async () => {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  try {
    await page.goto(base);
    await page.getByText('No signup needed', { exact: true }).waitFor();
    await page.getByRole('button', { name: '50% Capital', exact: true }).click();
    assert.equal(await page.locator('#rr-allocation').inputValue(), '50');
    await noOverflow(page);
  } finally { await page.close(); }
});
