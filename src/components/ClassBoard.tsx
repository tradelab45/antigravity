import React, { useCallback, useEffect, useState } from 'react';
import { Info, LogOut, RefreshCw, Users } from 'lucide-react';
import { useSimulator } from '../context/SimulatorContext';
import { formatINR } from '../utils/formatters';

interface BoardMember {
  name: string;
  reportedPortfolioValue: number | null;
  reportedTrades: number | null;
  reportedAt: string | null;
}

const CODE_PATTERN = /^[A-Z0-9-]{4,16}$/;
const STORAGE_KEY = 'rr_class_code';

/**
 * A class board: a teacher hands out a code, learners join it, and everyone
 * in it can see how the class is getting on.
 *
 * The figures are reported by each learner's own browser, because the
 * simulator executes trades on the device and the server never sees an order.
 * That is stated on screen rather than papered over — a board that looks
 * authoritative while being editable by anyone with developer tools would be
 * worse than no board.
 */
export const ClassBoard: React.FC = () => {
  const { currentUser, portfolioValue, orders } = useSimulator();

  const [classCode, setClassCode] = useState<string>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) || '';
    } catch {
      return '';
    }
  });
  const [draftCode, setDraftCode] = useState('');
  const [members, setMembers] = useState<BoardMember[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const loadBoard = useCallback(async (code: string) => {
    if (!code) return;
    try {
      const res = await fetch(`/api/class/${encodeURIComponent(code)}/board`);
      if (!res.ok) {
        setMembers([]);
        return;
      }
      const data = await res.json();
      setMembers(Array.isArray(data.members) ? data.members : []);
    } catch {
      setError('Could not reach the class board. It needs the RupeeRookie server running.');
    }
  }, []);

  // Report where this device has got to, then read the board back.
  useEffect(() => {
    if (!classCode || !currentUser?.id) return;
    let cancelled = false;

    (async () => {
      try {
        await fetch('/api/class/report', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: currentUser.id,
            portfolioValue,
            totalTrades: orders.length,
          }),
        });
      } catch {
        // The board still renders from whatever the server already has.
      }
      if (!cancelled) await loadBoard(classCode);
    })();

    return () => {
      cancelled = true;
    };
  }, [classCode, currentUser?.id, portfolioValue, orders.length, loadBoard]);

  const join = async () => {
    const code = draftCode.trim().toUpperCase();
    setError('');
    if (!CODE_PATTERN.test(code)) {
      setError('A class code is 4 to 16 letters, numbers or hyphens.');
      return;
    }
    if (!currentUser?.id) {
      setError('Sign in before joining a class board.');
      return;
    }

    setBusy(true);
    try {
      const res = await fetch('/api/class/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id, classCode: code }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.message || 'Could not join that class board.');
        return;
      }
      try {
        localStorage.setItem(STORAGE_KEY, code);
      } catch {
        // A stored code is a convenience; the join itself already happened.
      }
      setClassCode(code);
      setDraftCode('');
    } catch {
      setError('Could not reach the class board. It needs the RupeeRookie server running.');
    } finally {
      setBusy(false);
    }
  };

  const leave = async () => {
    if (!currentUser?.id) return;
    setBusy(true);
    try {
      await fetch('/api/class/leave', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id }),
      });
    } catch {
      // Leaving locally is still the right outcome for this device.
    } finally {
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch {
        // Nothing to clean up.
      }
      setClassCode('');
      setMembers(null);
      setBusy(false);
    }
  };

  if (!classCode) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900 sm:p-6">
        <h3 className="flex items-center gap-2 text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white">
          <Users className="h-4 w-4 text-indigo-600 dark:text-indigo-400" /> Class board
        </h3>
        <p className="mt-1 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
          Enter the code your teacher gave you to see how your class is getting on.
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          <label className="min-w-0 flex-1">
            <span className="sr-only">Class code</span>
            <input
              value={draftCode}
              onChange={(event) => setDraftCode(event.target.value.toUpperCase())}
              onKeyDown={(event) => {
                if (event.key === 'Enter') join();
              }}
              placeholder="CLASS-9B"
              maxLength={16}
              className="min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 font-mono text-sm font-bold uppercase tracking-wider text-slate-900 outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
            />
          </label>
          <button
            type="button"
            onClick={join}
            disabled={busy}
            className="min-h-11 shrink-0 rounded-xl bg-indigo-600 px-4 text-xs font-black text-white transition-colors hover:bg-indigo-500 disabled:opacity-50"
          >
            Join
          </button>
        </div>

        {error && (
          <p role="alert" className="mt-2 text-xs font-bold text-rose-600 dark:text-rose-400">
            {error}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="flex items-center gap-2 text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white">
            <Users className="h-4 w-4 text-indigo-600 dark:text-indigo-400" /> Class board
          </h3>
          <p className="mt-0.5 font-mono text-xs font-bold text-indigo-700 dark:text-indigo-300">
            {classCode}
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            onClick={() => loadBoard(classCode)}
            className="inline-flex min-h-9 items-center gap-1.5 rounded-xl border border-slate-200 px-3 text-[11px] font-black text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <RefreshCw className="h-3.5 w-3.5" /> Refresh
          </button>
          <button
            type="button"
            onClick={leave}
            disabled={busy}
            className="inline-flex min-h-9 items-center gap-1.5 rounded-xl border border-slate-200 px-3 text-[11px] font-black text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <LogOut className="h-3.5 w-3.5" /> Leave
          </button>
        </div>
      </div>

      <p className="mt-3 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] leading-relaxed text-amber-900 dark:border-amber-900 dark:bg-amber-950/50 dark:text-amber-200">
        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        <span>
          Trades run on each learner&rsquo;s own device, so these figures are reported
          rather than checked. Read this as a class noticeboard, not a scoreboard.
        </span>
      </p>

      {members === null && (
        <p className="mt-4 text-xs text-slate-500 dark:text-slate-400">Loading the board…</p>
      )}

      {members !== null && members.length === 0 && (
        <p className="mt-4 text-xs text-slate-500 dark:text-slate-400">
          Nobody else has joined {classCode} yet. Share the code with your class.
        </p>
      )}

      {members !== null && members.length > 0 && (
        <ol className="mt-4 space-y-1.5">
          {members.map((member, index) => (
            <li
              key={`${member.name}-${index}`}
              className="flex items-center gap-3 rounded-xl border border-slate-200 px-3 py-2 dark:border-slate-800"
            >
              <span className="w-6 shrink-0 font-mono text-xs font-black text-slate-400">
                {index + 1}
              </span>
              <span className="min-w-0 flex-1 truncate text-xs font-bold text-slate-900 dark:text-white">
                {member.name}
              </span>
              <span className="shrink-0 text-right">
                <span className="block font-mono text-xs font-black tabular-nums text-slate-900 dark:text-white">
                  {member.reportedPortfolioValue === null
                    ? 'Not reported'
                    : formatINR(member.reportedPortfolioValue)}
                </span>
                <span className="block text-[10px] font-medium text-slate-500 dark:text-slate-400">
                  {member.reportedTrades === null
                    ? '—'
                    : `${member.reportedTrades} trade${member.reportedTrades === 1 ? '' : 's'}`}
                </span>
              </span>
            </li>
          ))}
        </ol>
      )}

      {error && (
        <p role="alert" className="mt-3 text-xs font-bold text-rose-600 dark:text-rose-400">
          {error}
        </p>
      )}
    </div>
  );
};

export default ClassBoard;
