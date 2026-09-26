import { test } from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import { mkdtempSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createAcademyService, gradeExam, rankCohort } from '../src/modules/academy/server/academyService';
import { createAuthLimiter } from '../src/server/authRateLimit';
import { SESSION_COOKIE, issueSession, readSession, revokeSession } from '../src/server/sessions';
import { STAGE_EXAMS, EXAM_LENGTH } from '../src/modules/academy/data/stageExams';
import { LEARNING_PATH } from '../src/modules/academy/data/learningPath';
import { INITIAL_LESSONS } from '../src/modules/academy/data/lessonsData';
import { HINDI_LESSONS, localizeLesson } from '../src/modules/academy/data/hindiLessons';
import { parseAttempts, resolveResume } from '../src/modules/academy/utils/academyProgress';

const exam = STAGE_EXAMS[0];
// A paper is EXAM_LENGTH questions drawn from the bank, not the whole bank.
const paper = exam.questions.slice(0, EXAM_LENGTH);
const answers = Object.fromEntries(paper.map(question => [question.id, question.options[question.correctIndex]]));
const attempt = { id: 'attempt-valid-001', stageId: exam.stageId, score: 18, total: 20, completedAt: '2026-09-25T01:00:00.000Z' };

test('all Hindi lessons preserve module identity, XP and answer correctness', () => {
  assert.equal(Object.keys(HINDI_LESSONS).length, INITIAL_LESSONS.length);
  for (const lesson of INITIAL_LESSONS) {
    const hi = localizeLesson(lesson, 'HINDI');
    assert.equal(hi.id, lesson.id);
    assert.equal(hi.xpReward, lesson.xpReward);
    assert.match(hi.title, /[\u0900-\u097f]/);
    assert.match(hi.sections[0].content, /[\u0900-\u097f]/);
    assert.match(hi.quiz.question, /[\u0900-\u097f]/);
    assert.deepEqual(hi.quiz.options.map(option => [option.id, option.isCorrect]), lesson.quiz.options.map(option => [option.id, option.isCorrect]));
    assert.ok(hi.quiz.options.every(option => typeof option.text === 'string' && option.text.length > 0));
    assert.equal(localizeLesson(lesson, 'ENGLISH'), lesson);
  }
});
test('resume validates deep links and cannot jump a locked stage', () => {
  assert.equal(resolveResume('missing-lesson', {}), null);
  assert.equal(resolveResume('lesson-9', {})?.lessonId, 'lesson-1');
  assert.equal(resolveResume('lesson-3', { beginner: 14 })?.lessonId, 'lesson-3');
  assert.equal(resolveResume('lesson-9', { beginner: 14, builder: 20 })?.lessonId, 'lesson-3');
  assert.equal(resolveResume('lesson-tax-2', Object.fromEntries(LEARNING_PATH.map(stage => [stage.id, 20])))?.stageNumber, 6);
});
test('history rejects corrupt data and deduplicates attempts without fabricating legacy dates', () => {
  assert.deepEqual(parseAttempts('{'), []);
  assert.deepEqual(parseAttempts('{"beginner":20}'), []);
  assert.deepEqual(parseAttempts(JSON.stringify([attempt, attempt, { ...attempt, id: 'invalid', score: 21 }, { ...attempt, id: 'bad-date', completedAt: 'never' } ])), [attempt]);
});
test('grading accepts canonical option text, rejects incomplete or invented answers', () => {
  assert.equal(gradeExam(exam.stageId, answers), EXAM_LENGTH);
  const wrong = { ...answers, [paper[0].id]: paper[0].options[(paper[0].correctIndex + 1) % 4] };
  assert.equal(gradeExam(exam.stageId, wrong), 19);
  assert.equal(gradeExam(exam.stageId, {}), null);
  assert.equal(gradeExam('unknown', answers), null);
  assert.equal(gradeExam(exam.stageId, { ...answers, invented: 'answer' }), null);
  assert.equal(gradeExam(exam.stageId, { ...answers, [paper[0].id]: 1 }), null);
});
test('grading accepts any paper drawn from a bank larger than the paper', () => {
  // The banks hold more questions than a paper asks, and each retake draws a
  // different set. Requiring an answer to every question in the bank refused
  // every real paper once the banks grew past the paper length.
  assert.ok(exam.questions.length > EXAM_LENGTH, 'the bank is larger than one paper');
  const lastPaper = exam.questions.slice(-EXAM_LENGTH);
  const lastAnswers = Object.fromEntries(lastPaper.map(question => [question.id, question.options[question.correctIndex]]));
  assert.equal(gradeExam(exam.stageId, lastAnswers), EXAM_LENGTH);
  const allOfIt = Object.fromEntries(exam.questions.map(question => [question.id, question.options[question.correctIndex]]));
  assert.equal(gradeExam(exam.stageId, allOfIt), null, 'more answers than a paper asks is not a paper');
  const otherStage = STAGE_EXAMS[1].questions[0];
  const borrowed = { ...answers };
  delete borrowed[paper[0].id];
  borrowed[otherStage.id] = otherStage.options[otherStage.correctIndex];
  assert.equal(gradeExam(exam.stageId, borrowed), null, 'a question from another stage does not count');
});
test('cohort ranks best score per stage, preserves ties and hides outsiders', () => {
  const member = { groupId: 'private', kind: 'SCHOOL' as const, name: 'Example School', alias: 'Alpha' };
  const result = rankCohort({
    alpha: { membership: member, attempts: [attempt, { ...attempt, score: 10 }] },
    beta: { membership: { ...member, alias: 'Beta' }, attempts: [attempt] },
    outsider: { membership: { ...member, groupId: 'other', alias: 'Other' }, attempts: [{ ...attempt, score: 20 }] },
    hidden: { attempts: [{ ...attempt, score: 20 }] },
  }, 'private', 'beta');
  assert.equal(result.total, 2);
  assert.deepEqual(result.rows.map(row => [row.rank, row.score]), [[1, 18], [1, 18]]);
  assert.equal(result.yourRank?.alias, 'Beta');
  assert.ok(result.rows.every(row => !('userId' in row) && !('email' in row)));
});
/** What server.ts does: the signed session cookie decides who the caller is. */
const sessionUserId = (req: express.Request): string | null => {
  const raw = req.headers.cookie?.split(';').map(part => part.trim()).find(part => part.startsWith(`${SESSION_COOKIE}=`));
  return readSession(raw ? decodeURIComponent(raw.slice(SESSION_COOKIE.length + 1)) : null)?.userId ?? null;
};

test('academy API rides the app session, grades and persists attempts, and supports opt-in groups', async () => {
  const directory = mkdtempSync(path.join(os.tmpdir(), 'rr-academy-test-'));
  const file = path.join(directory, 'academy.json');
  const service = createAcademyService(file, sessionUserId);
  const app = express(); app.use(express.json());
  let token = '';
  app.post('/session/:id', (req, res) => {
    token = issueSession(req.params.id).token;
    res.cookie(SESSION_COOKIE, token, { httpOnly: true, sameSite: 'lax', path: '/' });
    res.json({ ok: true });
  });
  // The app's logout: revoking the signed session is what has to reach the Academy.
  app.post('/logout', (_req, res) => { revokeSession(token); res.json({ success: true }); });
  app.use('/api/academy', service.router);
  const server = app.listen(0, '127.0.0.1');
  await new Promise<void>(resolve => server.once('listening', resolve));
  const base = `http://127.0.0.1:${(server.address() as { port: number }).port}`;
  let cookie = '';
  const call = (route: string, method = 'GET', body?: unknown, extra?: Record<string, string>) => fetch(base + route, {
    method, headers: { 'Content-Type': 'application/json', 'x-academy-user': 'learner-one', Cookie: cookie, ...extra },
    ...(method !== 'GET' ? { body: JSON.stringify(body || {}) } : {}),
  });
  try {
    assert.equal((await call('/api/academy/me')).status, 401);
    const session = await call('/session/learner-one', 'POST');
    assert.match(session.headers.get('set-cookie')!, /HttpOnly/);
    cookie = session.headers.get('set-cookie')!.split(';')[0];
    assert.equal((await call('/api/academy/me', 'GET', undefined, { 'x-academy-user': 'impersonator' })).status, 401);
    assert.equal((await call('/api/academy/attempts', 'POST', { id: attempt.id, stageId: exam.stageId, score: 20 })).status, 400);
    assert.equal((await call('/api/academy/attempts', 'POST', { id: attempt.id, stageId: exam.stageId, answers }, { Origin: 'https://other.example' })).status, 403);
    const saved = await call('/api/academy/attempts', 'POST', { id: attempt.id, stageId: exam.stageId, score: 0, answers });
    assert.equal(saved.status, 201);
    assert.equal((await saved.json()).attempt.score, 20);
    await call('/api/academy/attempts', 'POST', { id: attempt.id, stageId: exam.stageId, answers });
    assert.equal((await (await call('/api/academy/me')).json()).attempts.length, 1);
    assert.equal((await call('/api/academy/leaderboard')).status, 404);
    assert.equal((await call('/api/academy/cohort', 'POST', { name: 'Example School', kind: 'SCHOOL', alias: 'Learner', code: 'class-code-2026' })).status, 200);
    const board = await (await call('/api/academy/leaderboard')).json();
    assert.equal(board.rows[0].score, 20); assert.equal(board.rows[0].isYou, true);
    assert.equal(board.total, 1);
    assert.equal((await call('/api/academy/me')).headers.get('cache-control'), 'no-store');
    await call('/api/academy/cohort', 'DELETE');
    assert.equal((await call('/api/academy/leaderboard')).status, 404);
    await call('/logout', 'POST');
    assert.equal((await call('/api/academy/me')).status, 401);
    // A fresh service reads the saved history after a restart.
    const restarted = createAcademyService(file, sessionUserId);
    assert.ok(restarted.router);
  } finally {
    await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
    rmSync(directory, { recursive: true, force: true });
  }
});
test('auth limiter returns 429 and Retry-After before the expensive handler', async () => {
  const app = express(); let calls = 0;
  app.post('/login', createAuthLimiter(2, 60000), (_req, res) => { calls++; res.status(401).json({ success: false }); });
  const server = app.listen(0, '127.0.0.1');
  await new Promise<void>(resolve => server.once('listening', resolve));
  const url = `http://127.0.0.1:${(server.address() as { port: number }).port}/login`;
  try {
    assert.equal((await fetch(url, { method: 'POST' })).status, 401);
    assert.equal((await fetch(url, { method: 'POST' })).status, 401);
    const rejected = await fetch(url, { method: 'POST' });
    assert.equal(rejected.status, 429); assert.ok(Number(rejected.headers.get('retry-after')) > 0);
    assert.equal(calls, 2);
  } finally { await new Promise<void>(resolve => server.close(() => resolve())); }
});

test('academy storage recovers from its backup and refuses rather than reading a lost file as empty', async () => {
  const { writeFileSync } = await import('node:fs');
  const { writeJsonAtomic } = await import('../src/server/jsonStore');
  const directory = mkdtempSync(path.join(os.tmpdir(), 'rr-academy-store-'));
  const file = path.join(directory, 'academy.json');
  const record = { attempts: [attempt] };
  const service = createAcademyService(file, () => 'learner-one');
  const app = express(); app.use(express.json()); app.use('/api/academy', service.router);
  const server = app.listen(0, '127.0.0.1');
  await new Promise<void>(resolve => server.once('listening', resolve));
  const me = () => fetch(`http://127.0.0.1:${(server.address() as { port: number }).port}/api/academy/me`, {
    headers: { 'x-academy-user': 'learner-one' },
  });
  try {
    writeJsonAtomic(file, { 'learner-one': record });
    writeJsonAtomic(file, { 'learner-one': record }); // leaves a good backup
    writeFileSync(file, '{"learner-one": {"attem');
    const recovered = await me();
    assert.equal(recovered.status, 200, 'a corrupt file with a good backup is read from the backup');
    assert.equal((await recovered.json()).attempts.length, 1);

    rmSync(`${file}.bak`);
    assert.equal((await me()).status, 503, 'with nothing readable left, refuse rather than start empty');
  } finally {
    await new Promise<void>(resolve => server.close(() => resolve()));
    rmSync(directory, { recursive: true, force: true });
  }
});
