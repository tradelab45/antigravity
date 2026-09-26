import { Router, type Request, type Response } from 'express';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { getStageExam, EXAM_LENGTH, EXAM_PASS_MARK } from '../data/stageExams';
import type { ExamAttempt } from '../utils/academyProgress';
import { rateLimit } from 'express-rate-limit';

interface Membership { groupId: string; name: string; kind: 'SCHOOL' | 'COLLEGE'; alias: string }
interface AcademyRecord { attempts: ExamAttempt[]; membership?: Membership }
type Database = Record<string, AcademyRecord>;

/**
 * Grades a submitted paper against the bank it was drawn from.
 *
 * A paper is EXAM_LENGTH questions drawn from a larger bank, so the answers
 * cover a subset of the bank's questions rather than all of them. Requiring an
 * answer for every question in the bank refused every paper once the banks
 * grew past the paper length. Each answer must name a question in this stage's
 * bank and one of that question's options; anything else rejects the attempt.
 */
export function gradeExam(stageId: string, answers: unknown): number | null {
  const exam = getStageExam(stageId);
  if (!exam || !answers || typeof answers !== 'object' || Array.isArray(answers)) return null;
  const entries = Object.entries(answers as Record<string, unknown>);
  if (entries.length !== EXAM_LENGTH) return null;

  const bank = new Map(exam.questions.map(question => [question.id, question]));
  let score = 0;
  for (const [id, answer] of entries) {
    const question = bank.get(id);
    if (!question || typeof answer !== 'string' || !question.options.includes(answer)) return null;
    if (answer === question.options[question.correctIndex]) score += 1;
  }
  return score;
}

export function rankCohort(db: Database, groupId: string, viewerId: string) {
  const rows = Object.entries(db).filter(([, record]) => record.membership?.groupId === groupId).map(([id, record]) => {
    const best: Record<string, number> = {};
    for (const attempt of record.attempts) best[attempt.stageId] = Math.max(best[attempt.stageId] || 0, attempt.score);
    return {
      alias: record.membership!.alias, isYou: id === viewerId,
      score: Object.values(best).reduce((sum, score) => sum + score, 0),
      stagesPassed: Object.values(best).filter(score => score >= EXAM_PASS_MARK).length,
    };
  }).sort((a, b) => b.score - a.score || a.alias.localeCompare(b.alias));
  let rank = 0;
  const ranked = rows.map((row, i) => {
    if (i === 0 || rows[i - 1].score !== row.score) rank = i + 1;
    return { ...row, rank };
  });
  return { rows: ranked.slice(0, 50), total: rows.length, yourRank: ranked.find(row => row.isYou) || null };
}

/**
 * The Academy's server side: synced exam attempts and school/college rankings.
 *
 * `resolveUserId` is the app's own session check. The service used to keep a
 * second session store of its own, with its own cookie and its own logout
 * route registered ahead of the app's — so signing out cleared the Academy
 * cookie and answered before the real session was ever revoked. One identity
 * system means a sign-out, a revoke-everywhere, a password change or a deleted
 * account reaches the Academy too.
 */
export function createAcademyService(file: string, resolveUserId: (req: Request) => string | null) {
  const router = Router();
  const read = (): Database => {
    if (!fs.existsSync(file)) return {};
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  };
  const write = (db: Database) => {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(`${file}.tmp`, JSON.stringify(db), { mode: 0o600 });
    fs.renameSync(`${file}.tmp`, file);
  };
  router.use((_req, res, next) => { res.set('Cache-Control', 'no-store'); next(); });
  router.use((req, res, next) => {
    const userId = resolveUserId(req);
    // The header is the account this tab believes it is signed in as. The
    // session decides who the caller is; a mismatch means the tab is stale —
    // another account signed in elsewhere — and is refused rather than
    // silently writing to the other account.
    if (!userId || req.get('x-academy-user') !== userId) {
      res.status(401).json({ message: 'Sign in again to sync exams or join your school/college leaderboard.' });
      return;
    }
    if (req.method !== 'GET') {
      const origin = req.get('origin');
      if (!req.is('application/json') || (origin && new URL(origin).host !== req.get('host'))) {
        res.status(403).json({ message: 'Same-origin JSON requests only.' });
        return;
      }
    }
    res.locals.userId = userId;
    next();
  });
  router.use(rateLimit({ windowMs: 15 * 60 * 1000, limit: 120, keyGenerator: (_req, res) => res.locals.userId, standardHeaders: 'draft-8', legacyHeaders: false, message: { message: 'Too many Academy requests. Please wait and try again.' } }));
  router.get('/me', (_req, res) => {
    const record = read()[res.locals.userId];
    res.json({ attempts: record?.attempts || [], membership: record?.membership || null });
  });
  router.post('/attempts', (req, res) => {
    const { id, stageId, answers } = req.body;
    const score = typeof stageId === 'string' ? gradeExam(stageId, answers) : null;
    if (typeof id !== 'string' || !/^[a-zA-Z0-9-]{10,80}$/.test(id) || score === null) {
      res.status(400).json({ message: 'A complete, valid exam attempt is required.' }); return;
    }
    const db = read();
    const userId = res.locals.userId;
    const record = db[userId] ||= { attempts: [] };
    const existing = record.attempts.find(attempt => attempt.id === id);
    if (existing) { res.json({ attempt: existing }); return; }
    const attempt = { id, stageId, score, total: EXAM_LENGTH, completedAt: new Date().toISOString() };
    record.attempts.push(attempt);
    // Retain stage bests as well as the latest history when trimming.
    if (record.attempts.length > 500) {
      const best = new Map<string, ExamAttempt>();
      for (const item of record.attempts) if (item.score > (best.get(item.stageId)?.score ?? -1)) best.set(item.stageId, item);
      const kept = new Map([...best.values(), ...record.attempts.slice(-490)].map(item => [item.id, item]));
      record.attempts = [...kept.values()];
    }
    write(db);
    res.status(201).json({ attempt });
  });
  router.post('/cohort', (req, res) => {
    const { name, kind, alias, code } = req.body;
    if (typeof name !== 'string' || name.trim().length < 2 || name.length > 80
      || !['SCHOOL', 'COLLEGE'].includes(kind) || typeof alias !== 'string' || alias.trim().length < 2 || alias.length > 30
      || typeof code !== 'string' || !/^[a-zA-Z0-9-]{8,40}$/.test(code)) {
      res.status(400).json({ message: 'Enter an institution, a nickname, and an 8-40 character group code (letters, digits or hyphens).' }); return;
    }
    const normalizedName = name.trim().replace(/\s+/g, ' ');
    const groupId = createHash('sha256').update(`${kind}:${normalizedName.toLowerCase()}:${code.toLowerCase()}`).digest('hex');
    const db = read();
    const userId = res.locals.userId;
    if (Object.entries(db).some(([id, record]) => id !== userId && record.membership?.groupId === groupId && record.membership.alias.toLowerCase() === alias.trim().toLowerCase())) {
      res.status(409).json({ message: 'That nickname is already in this group.' }); return;
    }
    const record = db[userId] ||= { attempts: [] };
    record.membership = { groupId, name: normalizedName, kind, alias: alias.trim() };
    write(db);
    res.json({ membership: record.membership });
  });
  router.delete('/cohort', (_req, res) => {
    const db = read();
    if (db[res.locals.userId]) delete db[res.locals.userId].membership;
    write(db);
    res.json({ success: true });
  });
  router.get('/leaderboard', (_req, res) => {
    const db = read();
    const membership = db[res.locals.userId]?.membership;
    if (!membership) { res.status(404).json({ message: 'Join a group first.' }); return; }
    res.json({ membership, ...rankCohort(db, membership.groupId, res.locals.userId) });
  });
  router.use((_error: unknown, _req: Request, res: Response, _next: unknown) => {
    res.status(503).json({ message: 'Academy storage is temporarily unavailable. Your local progress is unchanged.' });
  });
  return { router };
}
