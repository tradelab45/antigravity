import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { GraduationCap, X } from 'lucide-react';
import type { AppTabType } from './Header';
import type { PracticeAction } from '../data/practiceActions';

const STORAGE_KEY = 'rr_practice_task';

interface StoredTask extends PracticeAction {
  lessonTitle: string;
  startedAt: number;
}

/** Tasks older than this are stale — the learner has moved on. */
const TASK_LIFETIME_MS = 30 * 60 * 1000;

const readTask = (): StoredTask | null => {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const task = JSON.parse(raw) as StoredTask;
    if (!task?.task || Date.now() - task.startedAt > TASK_LIFETIME_MS) {
      sessionStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return task;
  } catch {
    return null;
  }
};

/** Hands a task from a finished lesson to the view where it is carried out. */
export const startPracticeTask = (action: PracticeAction, lessonTitle: string): void => {
  try {
    const task: StoredTask = { ...action, lessonTitle, startedAt: Date.now() };
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(task));
    window.dispatchEvent(new CustomEvent('rr_practice_task'));
  } catch {
    // A task that cannot be stored simply does not follow the learner over.
  }
};

export const clearPracticeTask = (): void => {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
    window.dispatchEvent(new CustomEvent('rr_practice_task'));
  } catch {
    // Nothing to clean up.
  }
};

/**
 * Shows the task a lesson handed over, on the view it belongs to.
 *
 * Rendered once at app level so every destination is covered without each view
 * having to know the Academy exists.
 */
export const PracticeTaskBanner: React.FC<{ activeTab: AppTabType }> = ({ activeTab }) => {
  const [task, setTask] = useState<StoredTask | null>(readTask);

  useEffect(() => {
    const sync = () => setTask(readTask());
    window.addEventListener('rr_practice_task', sync);
    return () => window.removeEventListener('rr_practice_task', sync);
  }, []);

  // Re-read on navigation so the banner appears as soon as the learner arrives.
  useEffect(() => {
    setTask(readTask());
  }, [activeTab]);

  const visible = task && task.tab === activeTab;

  return (
    <AnimatePresence>
      {visible && (
        <motion.section
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.18 }}
          aria-label="Practice task from your lesson"
          className="mb-4 rounded-2xl border border-indigo-300 bg-indigo-50 p-4 dark:border-indigo-800 dark:bg-indigo-950/60"
        >
          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white">
              <GraduationCap className="h-4 w-4" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-black uppercase tracking-wider text-indigo-700 dark:text-indigo-300">
                Practice · from {task.lessonTitle}
              </p>
              <p className="mt-1 text-sm font-black leading-snug text-indigo-950 dark:text-indigo-100">
                {task.task}
              </p>
              <p className="mt-1 text-[11px] font-medium leading-relaxed text-indigo-900/80 dark:text-indigo-200/80">
                {task.reason}
              </p>
              <button
                type="button"
                onClick={clearPracticeTask}
                className="mt-2.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-[11px] font-black text-white hover:bg-indigo-700"
              >
                Done
              </button>
            </div>
            <button
              type="button"
              onClick={clearPracticeTask}
              aria-label="Dismiss practice task"
              className="rounded-lg p-1.5 text-indigo-700 hover:bg-indigo-100 dark:text-indigo-300 dark:hover:bg-indigo-900"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </motion.section>
      )}
    </AnimatePresence>
  );
};
