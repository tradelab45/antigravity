import { LEARNING_PATH, getStageForLesson } from '../data/learningPath';
import { EXAM_LENGTH, EXAM_PASS_MARK } from '../data/stageExams';

export interface ExamAttempt {
  id: string;
  stageId: string;
  score: number;
  total: number;
  completedAt: string;
}

export const academyStorageKey = (userId?: string) => `rr_academy_workspace:${userId || 'guest'}`;

export function parseAttempts(raw: string | null): ExamAttempt[] {
  try {
    const records: unknown = JSON.parse(raw || '[]');
    if (!Array.isArray(records)) return [];
    const seen = new Set<string>();
    return records.filter((item): item is ExamAttempt => {
      if (!item || typeof item !== 'object') return false;
      const valid = typeof item.id === 'string' && !seen.has(item.id)
        && LEARNING_PATH.some(stage => stage.id === item.stageId)
        && Number.isInteger(item.score) && item.score >= 0 && item.score <= EXAM_LENGTH
        && item.total === EXAM_LENGTH && typeof item.completedAt === 'string'
        && Number.isFinite(Date.parse(item.completedAt));
      if (valid) seen.add(item.id);
      return valid;
    }).slice(-500);
  } catch { return []; }
}

export function resolveResume(lessonId: string | null, scores: Record<string, number>) {
  if (!lessonId || !LEARNING_PATH.some(stage => (stage.lessonIds as readonly string[]).includes(lessonId))) return null;
  const stageId = getStageForLesson(lessonId);
  const index = LEARNING_PATH.findIndex(stage => stage.id === stageId);
  const firstLocked = LEARNING_PATH.findIndex((_, i) => i > 0 && !(scores[LEARNING_PATH[i - 1].id] >= EXAM_PASS_MARK));
  const allowedIndex = firstLocked < 0 ? index : Math.min(index, firstLocked - 1);
  const stage = LEARNING_PATH[allowedIndex];
  return { stage, lessonId: allowedIndex === index ? lessonId : stage.lessonIds[0], stageNumber: allowedIndex + 1 };
}

export function readResume(userId?: string, requestedLesson?: string | null) {
  try {
    const key = academyStorageKey(userId);
    const scores = JSON.parse(localStorage.getItem(`${key}:exams`) || '{}');
    return resolveResume(requestedLesson || localStorage.getItem(`${key}:last`), scores && typeof scores === 'object' ? scores : {});
  } catch { return null; }
}
