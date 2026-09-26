import React, { useState } from 'react';
import { KeyRound, Loader2, ShieldCheck } from 'lucide-react';
import { useSimulator } from '../context/SimulatorContext';

/**
 * Changing the account password from inside the app.
 *
 * There was no way to do this at all: a password set at sign-up was the
 * password forever. The server does the checking — the old password, the
 * strength of the new one — and this only relays what it says, because a
 * rule enforced in the browser is a rule anyone can skip.
 *
 * Changing the password signs every other device out. That is stated up
 * front rather than discovered later on a phone that has gone quiet.
 */
export const ChangePasswordPanel: React.FC = () => {
  const { currentUser } = useSimulator();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState('');

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setDone('');

    if (newPassword !== confirmation) {
      setError('The two new passwords do not match.');
      return;
    }

    setBusy(true);
    try {
      const res = await fetch('/api/auth/password/change', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const contentType = res.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        setError('Changing a password needs the RupeeRookie server running.');
        return;
      }
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.message || 'The password could not be changed.');
        return;
      }
      setDone(data.message || 'Password changed.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmation('');
    } catch {
      setError('Could not reach the server. Nothing was changed.');
    } finally {
      setBusy(false);
    }
  };

  if (!currentUser) return null;

  const field =
    'mt-1 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white';
  const caption =
    'text-[11px] font-black uppercase tracking-wider text-slate-700 dark:text-slate-300';

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 sm:p-6">
      <h2 className="flex items-center gap-2 text-sm font-black text-slate-900 dark:text-white">
        <KeyRound className="h-4 w-4 text-indigo-600 dark:text-indigo-400" /> Change your password
      </h2>
      <p className="mt-1 max-w-2xl text-xs leading-relaxed text-slate-600 dark:text-slate-400">
        Every other device signed in to this account is signed out when the
        password changes. This browser stays signed in. If you only ever sign
        in with Google, leave the current password blank to set your first one.
      </p>

      <form onSubmit={submit} className="mt-4 grid gap-3 sm:max-w-md">
        <label className="block">
          <span className={caption}>Current password</span>
          <input
            type="password"
            value={currentPassword}
            onChange={(event) => setCurrentPassword(event.target.value)}
            autoComplete="current-password"
            className={field}
          />
        </label>

        <label className="block">
          <span className={caption}>New password</span>
          <input
            type="password"
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
            autoComplete="new-password"
            className={field}
          />
        </label>

        <label className="block">
          <span className={caption}>New password again</span>
          <input
            type="password"
            value={confirmation}
            onChange={(event) => setConfirmation(event.target.value)}
            autoComplete="new-password"
            className={field}
          />
        </label>

        {error && (
          <p role="alert" className="text-xs font-bold text-rose-700 dark:text-rose-300">
            {error}
          </p>
        )}
        {done && (
          <p
            role="status"
            className="flex items-start gap-2 text-xs font-bold text-emerald-800 dark:text-emerald-300"
          >
            <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span>{done}</span>
          </p>
        )}

        <div>
          <button
            type="submit"
            disabled={busy || !newPassword || !confirmation}
            className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-indigo-600 px-4 text-xs font-black text-white transition-colors hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
            {busy ? 'Changing…' : 'Change password'}
          </button>
        </div>
      </form>
    </section>
  );
};

export default ChangePasswordPanel;
