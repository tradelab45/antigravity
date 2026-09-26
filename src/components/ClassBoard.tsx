import React, { useCallback, useEffect, useState } from 'react';
import { CalendarClock, Info, LogOut, RefreshCw, Trash2, UserMinus, Users } from 'lucide-react';
import { useSimulator } from '../context/SimulatorContext';
import { formatINR } from '../utils/formatters';

interface BoardMember {
  name: string;
  /** Meaningless off this board; what the owner removes a learner by. */
  handle?: string;
  portfolioValue: number | null;
  trades: number | null;
  updatedAt: string | null;
  /**
   * True when the figure came from a ledger this server executed, false when
   * it is what a learner's browser reported. Shown per row, because a board
   * can hold both.
   */
  verified: boolean;
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
  const [notice, setNotice] = useState('');

  // Set from the board's own answer: whether this code was created here at
  // all, whether this viewer is the teacher who created it, and when it ends.
  const [managed, setManaged] = useState(false);
  const [owner, setOwner] = useState(false);
  const [expiresAt, setExpiresAt] = useState<number | null>(null);
  const [expired, setExpired] = useState(false);

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
      setManaged(Boolean(data.managed));
      setOwner(Boolean(data.owner));
      setExpiresAt(typeof data.expiresAt === 'number' ? data.expiresAt : null);
      setExpired(Boolean(data.expired));
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
          body: JSON.stringify({ portfolioValue, totalTrades: orders.length }),
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
        body: JSON.stringify({ classCode: code }),
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

  /**
   * Opens a board this account owns.
   *
   * A teacher who simply joins a code owns nothing — that board could be
   * anyone's. Creating one is what makes removing a member and an end date
   * possible.
   */
  const createBoard = async () => {
    setError('');
    setNotice('');
    if (!currentUser?.id) {
      setError('Sign in before creating a class board.');
      return;
    }

    setBusy(true);
    try {
      const wanted = draftCode.trim().toUpperCase();
      const res = await fetch('/api/class/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(wanted ? { classCode: wanted } : {}),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.message || 'Could not create a class board.');
        return;
      }
      try {
        localStorage.setItem(STORAGE_KEY, data.classCode);
      } catch {
        // The board itself exists; a remembered code is a convenience.
      }
      setClassCode(data.classCode);
      setDraftCode('');
      setNotice(data.message || '');
    } catch {
      setError('Could not reach the class board. It needs the RupeeRookie server running.');
    } finally {
      setBusy(false);
    }
  };

  /** Owner-only actions, all of which the server checks against the session. */
  const ownerAction = async (path: string, body: unknown, method: 'POST' | 'DELETE' = 'POST') => {
    setError('');
    setNotice('');
    setBusy(true);
    try {
      const res = await fetch(path, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body ?? {}),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.message || 'That did not work.');
        return false;
      }
      setNotice(data.message || '');
      return true;
    } catch {
      setError('Could not reach the server.');
      return false;
    } finally {
      setBusy(false);
    }
  };

  const removeMember = async (member: BoardMember) => {
    if (!member.handle) return;
    const done = await ownerAction(`/api/class/${encodeURIComponent(classCode)}/remove`, {
      handle: member.handle,
    });
    if (done) await loadBoard(classCode);
  };

  const extendBoard = async () => {
    const done = await ownerAction(`/api/class/${encodeURIComponent(classCode)}/extend`, { days: 300 });
    if (done) await loadBoard(classCode);
  };

  const closeBoard = async () => {
    const done = await ownerAction(`/api/class/${encodeURIComponent(classCode)}`, {}, 'DELETE');
    if (!done) return;
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Nothing to clean up.
    }
    setClassCode('');
    setMembers(null);
    setOwner(false);
    setManaged(false);
  };

  const leave = async () => {
    if (!currentUser?.id) return;
    setBusy(true);
    try {
      await fetch('/api/class/leave', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
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

        <div className="mt-4 border-t border-slate-200 pt-3 dark:border-slate-800">
          <p className="text-[11px] leading-relaxed text-slate-600 dark:text-slate-400">
            Teaching a class? Open a board you own. You can take someone off it,
            and it ends at the close of the year rather than following your
            students around for ever.
          </p>
          <button
            type="button"
            onClick={createBoard}
            disabled={busy}
            className="mt-2 inline-flex min-h-11 items-center gap-1.5 rounded-xl border border-indigo-300 px-3 text-[11px] font-black text-indigo-700 hover:bg-indigo-50 disabled:opacity-50 dark:border-indigo-800 dark:text-indigo-300 dark:hover:bg-indigo-950/40"
          >
            <Users className="h-3.5 w-3.5" />
            {draftCode.trim() ? `Create ${draftCode.trim().toUpperCase()} as my board` : 'Create a class board'}
          </button>
        </div>
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
          {owner && (
            <button
              type="button"
              onClick={closeBoard}
              disabled={busy}
              className="inline-flex min-h-9 items-center gap-1.5 rounded-xl border border-rose-200 px-3 text-[11px] font-black text-rose-700 hover:bg-rose-50 disabled:opacity-50 dark:border-rose-900 dark:text-rose-300 dark:hover:bg-rose-950/40"
            >
              <Trash2 className="h-3.5 w-3.5" /> Close board
            </button>
          )}
        </div>
      </div>

      {!managed && members !== null && (
        <p className="mt-3 flex items-start gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-[11px] leading-relaxed text-slate-700 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-300">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span>
            This code has no teacher: anyone who has it can join, nobody can be
            removed, and it does not expire. A teacher can open a board they own
            from the join screen.
          </span>
        </p>
      )}

      {expired && (
        <p className="mt-3 flex items-start gap-2 rounded-xl border border-slate-300 bg-slate-100 px-3 py-2 text-[11px] leading-relaxed text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
          <CalendarClock className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span>
            This board has finished, so nobody new can join it. The rows below
            are the class as it stood.
            {owner ? ' Extend it if your class is still using it.' : ' Ask your teacher for this year\u2019s code.'}
          </span>
        </p>
      )}

      {managed && expiresAt !== null && !expired && (
        <p className="mt-3 flex items-center gap-2 text-[11px] font-bold text-slate-600 dark:text-slate-400">
          <CalendarClock className="h-3.5 w-3.5" aria-hidden="true" />
          Open until {new Date(expiresAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
          {owner && (
            <button
              type="button"
              onClick={extendBoard}
              disabled={busy}
              className="ml-1 min-h-9 rounded-lg border border-slate-200 px-2 text-[10px] font-black text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              Extend
            </button>
          )}
        </p>
      )}

      {notice && (
        <p role="status" className="mt-2 text-[11px] font-bold text-emerald-700 dark:text-emerald-400">
          {notice}
        </p>
      )}

      {members !== null && members.some((member) => !member.verified) && (
        <p className="mt-3 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] leading-relaxed text-amber-900 dark:border-amber-900 dark:bg-amber-950/50 dark:text-amber-200">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span>
            Rows marked <strong>reported</strong> came from that learner&rsquo;s own
            browser rather than from a trade this server executed, so they are not
            checked. The rest were executed here.
          </span>
        </p>
      )}

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
              {!member.verified && (
                <span className="shrink-0 rounded-md bg-amber-100 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-amber-900 dark:bg-amber-950 dark:text-amber-300">
                  Reported
                </span>
              )}

              {owner && member.handle && (
                <button
                  type="button"
                  onClick={() => removeMember(member)}
                  disabled={busy}
                  title={`Remove ${member.name} from this board`}
                  className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-rose-50 hover:text-rose-700 disabled:opacity-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-rose-950/40 dark:hover:text-rose-300"
                >
                  <UserMinus className="h-3.5 w-3.5" aria-hidden="true" />
                  <span className="sr-only">Remove {member.name} from this board</span>
                </button>
              )}

              <span className="shrink-0 text-right">
                <span className="block font-mono text-xs font-black tabular-nums text-slate-900 dark:text-white">
                  {member.portfolioValue === null ? 'No trades yet' : formatINR(member.portfolioValue)}
                </span>
                <span className="block text-[10px] font-medium text-slate-500 dark:text-slate-400">
                  {member.trades === null
                    ? '—'
                    : `${member.trades} trade${member.trades === 1 ? '' : 's'}`}
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
