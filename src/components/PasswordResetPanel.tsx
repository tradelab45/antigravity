import React, { useState } from 'react';
import { ArrowLeft, KeyRound, Loader2, MailCheck } from 'lucide-react';

interface PasswordResetPanelProps {
  /** Whatever was already typed into the sign-in field, so it is not retyped. */
  initialIdentifier?: string;
  /** Called with the server's message once the password has been changed. */
  onDone: (message: string) => void;
  onCancel: () => void;
  /**
   * The two sign-in surfaces are lit differently — the full page is dark, the
   * modal is white — and the same class list cannot read on both.
   */
  tone?: 'dark' | 'light';
}

interface PendingReset {
  challengeId: string;
  maskedEmail: string;
  devCode?: string;
}

/**
 * Recovering a forgotten password.
 *
 * Until now a forgotten password meant starting a second account, which left
 * the first one's portfolio, journal and Academy progress stranded — and this
 * app is used by students on shared school machines, where that happens.
 *
 * Two steps: a code to the address the account was registered with, then the
 * new password. The server decides both — whether the identifier is known,
 * whether the code is right, whether the new password is strong enough — so
 * this component only relays what it says.
 *
 * It is rendered inside the sign-in card rather than over it, so there is no
 * second dialog to trap focus in and nothing to Escape out of by accident
 * half way through a code.
 */
export const PasswordResetPanel: React.FC<PasswordResetPanelProps> = ({
  initialIdentifier = '',
  onDone,
  onCancel,
  tone = 'dark',
}) => {
  const [identifier, setIdentifier] = useState(initialIdentifier);
  const [pending, setPending] = useState<PendingReset | null>(null);
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const post = async (path: string, body: unknown) => {
    const res = await fetch(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      throw new Error('Resetting a password needs the RupeeRookie server running.');
    }
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.message || 'That did not work. Try again.');
    }
    return data;
  };

  const requestCode = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    if (!identifier.trim()) {
      setError('Enter the email address or username on the account.');
      return;
    }

    setBusy(true);
    try {
      const data = await post('/api/auth/password/forgot', { identifier: identifier.trim() });
      setPending({
        challengeId: data.challengeId,
        maskedEmail: data.maskedEmail,
        devCode: data.devCode,
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const setNewPassword = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    if (password !== confirmation) {
      setError('The two passwords do not match.');
      return;
    }

    setBusy(true);
    try {
      const data = await post('/api/auth/password/reset', {
        challengeId: pending?.challengeId,
        code: code.trim(),
        password,
      });
      onDone(data.message || 'Password changed. Sign in with the new one.');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const dark = tone === 'dark';
  const field = dark
    ? 'w-full px-4 py-3 bg-[#08100b] border border-white/15 focus:border-mint focus:ring-1 focus:ring-mint rounded-xl text-white text-sm outline-none transition-all placeholder:text-slate-500'
    : 'w-full px-4 py-3 bg-white border border-slate-300 focus:border-slate-900 rounded-xl text-slate-900 text-sm outline-none transition-all placeholder:text-slate-500';
  const caption = dark ? 'text-xs font-bold text-slate-300' : 'text-xs font-bold text-slate-900';
  const body = dark ? 'text-slate-300' : 'text-slate-600';
  const heading = dark ? 'text-white' : 'text-slate-900';
  const accent = dark ? 'bg-mint/15 text-mint' : 'bg-slate-900/10 text-slate-900';
  const primary = dark
    ? 'bg-mint text-slate-950'
    : 'bg-slate-900 text-white';
  const secondary = dark
    ? 'border-white/15 text-slate-200'
    : 'border-slate-300 text-slate-700';
  const link = dark ? 'text-mint' : 'text-slate-900';
  const alarm = dark ? 'text-rose-300' : 'text-rose-700';
  const notice = dark
    ? 'border-amber-400/60 bg-amber-400/10 text-amber-200'
    : 'border-amber-300 bg-amber-50 text-amber-900';

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3">
        <div className={`rounded-xl p-2 ${accent}`}>
          {pending ? <MailCheck className="h-5 w-5" /> : <KeyRound className="h-5 w-5" />}
        </div>
        <div className="min-w-0">
          <h2 className={`text-sm font-black ${heading}`}>Reset your password</h2>
          <p className={`mt-1 text-xs leading-relaxed ${body}`}>
            {pending
              ? `A six-digit code is on its way to ${pending.maskedEmail}. It expires in ten minutes.`
              : 'We will email a code to the address this account was registered with.'}
          </p>
        </div>
      </div>

      {pending?.devCode && (
        <p className={`rounded-xl border px-3 py-2 text-xs font-bold ${notice}`}>
          Development mode — no email was sent. Your code is{' '}
          <span className="font-mono tracking-widest">{pending.devCode}</span>.
        </p>
      )}

      {!pending ? (
        <form onSubmit={requestCode} className="space-y-3">
          <label className="block space-y-1.5">
            <span className={caption}>Email address or username</span>
            <input
              type="text"
              value={identifier}
              onChange={(event) => setIdentifier(event.target.value)}
              placeholder="e.g. xyz@gmail.com or rookie_trader"
              autoComplete="username"
              className={field}
            />
          </label>

          {error && (
            <p role="alert" className={`text-xs font-bold ${alarm}`}>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={busy}
            className={`inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl px-4 text-sm font-black disabled:opacity-60 ${primary}`}
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {busy ? 'Sending…' : 'Email me a code'}
          </button>
        </form>
      ) : (
        <form onSubmit={setNewPassword} className="space-y-3">
          <label className="block space-y-1.5">
            <span className={caption}>Six-digit code</span>
            <input
              type="text"
              value={code}
              onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="000000"
              className={`${field} font-mono tracking-[0.4em]`}
            />
          </label>

          <label className="block space-y-1.5">
            <span className={caption}>New password</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="new-password"
              className={field}
            />
          </label>

          <label className="block space-y-1.5">
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
            <p role="alert" className={`text-xs font-bold ${alarm}`}>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={busy || code.length !== 6 || !password}
            className={`inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl px-4 text-sm font-black disabled:opacity-60 ${primary}`}
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {busy ? 'Changing…' : 'Set new password'}
          </button>

          <button
            type="button"
            onClick={() => {
              setPending(null);
              setCode('');
              setError('');
            }}
            className={`min-h-11 w-full rounded-xl border px-4 text-xs font-bold ${secondary}`}
          >
            Send the code again
          </button>
        </form>
      )}

      <button
        type="button"
        onClick={onCancel}
        className={`inline-flex min-h-11 items-center gap-1.5 text-xs font-black hover:underline ${link}`}
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Back to sign in
      </button>
    </div>
  );
};

export default PasswordResetPanel;
