import { useCallback, useEffect, useState } from 'react';
import { academyStorageKey, parseAttempts, type ExamAttempt } from '../utils/academyProgress';
import { EXAM_LENGTH } from '../data/stageExams';

export function useExamHistory(userId?: string) {
  const key = academyStorageKey(userId);
  const [attempts, setAttempts] = useState<ExamAttempt[]>(() => parseAttempts(localStorage.getItem(`${key}:history`)));
  const [notice, setNotice] = useState('');
  const merge = useCallback((incoming: ExamAttempt[]) => {
    setAttempts(previous => {
      const merged = [...new Map([...previous, ...incoming].map(item => [item.id, item])).values()]
        .sort((a, b) => a.completedAt.localeCompare(b.completedAt)).slice(-500);
      try { localStorage.setItem(`${key}:history`, JSON.stringify(merged)); }
      catch { setNotice('Device storage is full. Download your certificate before closing this page.'); }
      return merged;
    });
  }, [key]);
  const sync = useCallback(async () => {
    if (!userId || !navigator.onLine) { setNotice('Saved on this device. Online sync is unavailable.'); return; }
    try {
      const headers = { 'Content-Type': 'application/json', 'x-academy-user': userId };
      const me = await fetch('/api/academy/me', { headers });
      if (!me.ok) { setNotice(me.status === 401 ? 'Saved on this device. Sign in again to sync scores.' : 'Saved on this device. Score sync is temporarily unavailable.'); return; }
      const record = await me.json();
      merge(parseAttempts(JSON.stringify(record.attempts)));
      const queue = JSON.parse(localStorage.getItem(`${key}:pending`) || '[]');
      if (!Array.isArray(queue)) return;
      for (const pending of queue) {
        const response = await fetch('/api/academy/attempts', { method: 'POST', headers, body: JSON.stringify(pending) });
        if (!response.ok) { setNotice('Saved on this device. Some scores are waiting to sync.'); return; }
        const result = await response.json();
        merge(parseAttempts(JSON.stringify([result.attempt])));
        const current = JSON.parse(localStorage.getItem(`${key}:pending`) || '[]');
        localStorage.setItem(`${key}:pending`, JSON.stringify(current.filter((item: { id: string }) => item.id !== pending.id)));
      }
      setNotice('Scores synced. Exams are unproctored practice assessments.');
      window.dispatchEvent(new Event('rr-academy-synced'));
    } catch { setNotice('Saved on this device. Scores will retry when you reconnect.'); }
  }, [key, userId, merge]);
  useEffect(() => {
    void sync();
    window.addEventListener('online', sync);
    return () => window.removeEventListener('online', sync);
  }, [sync]);
  const recordAttempt = (stageId: string, score: number, answers: Record<string, string>) => {
    const attempt = { id: crypto.randomUUID(), stageId, score, total: EXAM_LENGTH, completedAt: new Date().toISOString() };
    merge([attempt]);
    try {
      const queue = JSON.parse(localStorage.getItem(`${key}:pending`) || '[]');
      localStorage.setItem(`${key}:pending`, JSON.stringify([...queue, { id: attempt.id, stageId, answers }].slice(-500)));
      void sync();
    } catch { setNotice('Saved in this session only: device storage is full.'); }
  };
  return { attempts, recordAttempt, notice, sync };
}
