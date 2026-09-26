import React, { useState } from 'react';
import { AlertTriangle, Loader2, Trash2 } from 'lucide-react';
import { useSimulator } from '../context/SimulatorContext';

/**
 * Deleting the account, for real.
 *
 * The privacy centre set out what is held and offered no way to remove any of
 * it. Two things have to happen and neither is enough alone: the server drops
 * the account record, and this browser drops everything it kept under that
 * user's id — holdings, journal, Academy progress, notes.
 *
 * Re-authentication is deliberate. A live session is not enough to destroy an
 * account, because a borrowed unlocked browser has one.
 */
export const DeleteAccountPanel: React.FC = () => {
  const { currentUser } = useSimulator();

  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  /** Everything this browser stored under the account's id. */
  const wipeLocalRecord = (userId: string) => {
    try {
      const doomed = Object.keys(localStorage).filter(
        (key) => key.includes(userId) || key === 'rr_current_user' || key === 'rr_auth_entry',
      );
      doomed.forEach((key) => localStorage.removeItem(key));
      sessionStorage.clear();
    } catch {
      // A browser refusing storage has nothing to clear.
    }
  };

  const remove = async () => {
    if (!currentUser?.id) return;
    setBusy(true);
    setError('');

    try {
      const res = await fetch('/api/account', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password, confirmation }),
      });
      const contentType = res.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        setError('Deleting an account needs the RupeeRookie server running.');
        return;
      }
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.message || 'The account could not be deleted.');
        return;
      }

      wipeLocalRecord(currentUser.id);
      window.location.reload();
    } catch {
      setError('Could not reach the server. Nothing was deleted.');
    } finally {
      setBusy(false);
    }
  };

  if (!currentUser) return null;

  return (
    <section className="rounded-3xl border border-rose-300 bg-rose-50 p-5 dark:border-rose-900 dark:bg-rose-950/30">
      <h2 className="flex items-center gap-2 text-sm font-black text-rose-900 dark:text-rose-200">
        <AlertTriangle className="h-4 w-4" /> Delete this account
      </h2>
      <p className="mt-1 max-w-2xl text-xs leading-relaxed text-rose-900/90 dark:text-rose-200/90">
        This removes the account record from the RupeeRookie server and clears
        everything this browser stored for it — holdings, orders, journal,
        Academy progress and notes. It cannot be undone, and any class board
        membership goes with it. Export anything you want to keep first.
      </p>

      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-xl border border-rose-400 px-4 text-xs font-black text-rose-800 transition-colors hover:bg-rose-100 dark:border-rose-800 dark:text-rose-200 dark:hover:bg-rose-950/60"
        >
          <Trash2 className="h-4 w-4" /> Delete my account
        </button>
      ) : (
        <div className="mt-4 space-y-3">
          <label className="block">
            <span className="text-[11px] font-black uppercase tracking-wider text-rose-900 dark:text-rose-200">
              Your password
            </span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              placeholder="Leave blank if you only sign in with Google"
              className="mt-1 min-h-11 w-full rounded-xl border border-rose-300 bg-white px-3 text-sm outline-none focus:border-rose-500 dark:border-rose-900 dark:bg-slate-950 dark:text-white"
            />
          </label>

          <label className="block">
            <span className="text-[11px] font-black uppercase tracking-wider text-rose-900 dark:text-rose-200">
              Type DELETE to confirm
            </span>
            <input
              value={confirmation}
              onChange={(event) => setConfirmation(event.target.value.toUpperCase())}
              placeholder="DELETE"
              className="mt-1 min-h-11 w-full rounded-xl border border-rose-300 bg-white px-3 font-mono text-sm tracking-widest outline-none focus:border-rose-500 dark:border-rose-900 dark:bg-slate-950 dark:text-white"
            />
          </label>

          {error && (
            <p role="alert" className="text-xs font-bold text-rose-700 dark:text-rose-300">
              {error}
            </p>
          )}

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={remove}
              disabled={busy || confirmation !== 'DELETE'}
              className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-rose-700 px-4 text-xs font-black text-white transition-colors hover:bg-rose-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              {busy ? 'Deleting…' : 'Delete permanently'}
            </button>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                setPassword('');
                setConfirmation('');
                setError('');
              }}
              className="min-h-11 rounded-xl border border-rose-300 px-4 text-xs font-black text-rose-800 dark:border-rose-900 dark:text-rose-200"
            >
              Keep my account
            </button>
          </div>
        </div>
      )}
    </section>
  );
};

export default DeleteAccountPanel;
