import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, Loader2, MailCheck, ShieldCheck } from 'lucide-react';
import { useSimulator } from '../context/SimulatorContext';
import type { PendingVerification } from '../context/SimulatorContext';
import type { UserAccount } from '../types';

interface VerificationCodeFormProps {
  pending: PendingVerification;
  onVerified: (user: UserAccount, message: string) => void;
  onCancel: () => void;
}

const CODE_LENGTH = 6;

/**
 * The second step of a sign-in: the six digits emailed to the account.
 *
 * One input per digit, because a code is read a digit at a time and pasting
 * the whole thing should still work. `inputMode="numeric"` and
 * `autoComplete="one-time-code"` let a phone offer the code straight from the
 * notification.
 */
export const VerificationCodeForm: React.FC<VerificationCodeFormProps> = ({
  pending,
  onVerified,
  onCancel,
}) => {
  const { completeVerification, resendVerificationCode, cancelVerification } = useSimulator();

  const [digits, setDigits] = useState<string[]>(() => Array(CODE_LENGTH).fill(''));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [devCode, setDevCode] = useState(pending.devCode);
  const [secondsLeft, setSecondsLeft] = useState(pending.expiresInSeconds);

  const inputs = useRef<Array<HTMLInputElement | null>>([]);
  const code = digits.join('');
  const complete = code.length === CODE_LENGTH && /^\d+$/.test(code);

  useEffect(() => {
    inputs.current[0]?.focus();
  }, []);

  // A visible clock, so nobody sits on a code that has already lapsed.
  useEffect(() => {
    if (secondsLeft <= 0) return;
    const timer = window.setInterval(() => setSecondsLeft((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [secondsLeft]);

  const clock = useMemo(() => {
    const minutes = Math.floor(secondsLeft / 60);
    const seconds = secondsLeft % 60;
    return `${minutes}:${String(seconds).padStart(2, '0')}`;
  }, [secondsLeft]);

  const setDigit = (index: number, value: string) => {
    const cleaned = value.replace(/\D/g, '');
    if (!cleaned) {
      setDigits((previous) => previous.map((digit, i) => (i === index ? '' : digit)));
      return;
    }
    // A paste lands in one box; spread it across the rest.
    setDigits((previous) => {
      const next = [...previous];
      for (let i = 0; i < cleaned.length && index + i < CODE_LENGTH; i += 1) {
        next[index + i] = cleaned[i];
      }
      return next;
    });
    const landed = Math.min(index + cleaned.length, CODE_LENGTH - 1);
    inputs.current[landed]?.focus();
  };

  const onKeyDown = (index: number, event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Backspace' && !digits[index] && index > 0) {
      event.preventDefault();
      inputs.current[index - 1]?.focus();
      setDigits((previous) => previous.map((digit, i) => (i === index - 1 ? '' : digit)));
    }
    if (event.key === 'ArrowLeft' && index > 0) inputs.current[index - 1]?.focus();
    if (event.key === 'ArrowRight' && index < CODE_LENGTH - 1) inputs.current[index + 1]?.focus();
  };

  const submit = async (event?: React.FormEvent) => {
    event?.preventDefault();
    if (!complete || busy) return;
    setBusy(true);
    setError('');
    setNotice('');

    const result = await completeVerification(pending.challengeId, code);
    setBusy(false);

    if (result.success && result.user) {
      onVerified(result.user, result.message);
      return;
    }
    setError(result.message);
    setDigits(Array(CODE_LENGTH).fill(''));
    inputs.current[0]?.focus();
  };

  const resend = async () => {
    if (busy) return;
    setBusy(true);
    setError('');
    const result = await resendVerificationCode(pending.challengeId);
    setBusy(false);
    if (result.success) {
      setNotice(result.message);
      setSecondsLeft(pending.expiresInSeconds);
      setDevCode(result.devCode);
      setDigits(Array(CODE_LENGTH).fill(''));
      inputs.current[0]?.focus();
    } else {
      setError(result.message);
    }
  };

  const cancel = () => {
    cancelVerification(pending.challengeId);
    onCancel();
  };

  return (
    <form onSubmit={submit} className="space-y-5" noValidate>
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
          <MailCheck className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <h2 className="text-lg font-black text-slate-900 dark:text-white">Check your email</h2>
          <p className="mt-1 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
            We sent a {CODE_LENGTH}-digit code to{' '}
            <strong className="font-mono text-slate-900 dark:text-white">{pending.maskedEmail}</strong>.
            Enter it here to finish signing in.
          </p>
        </div>
      </div>

      {devCode && (
        <p className="rounded-xl border border-amber-300 bg-amber-50 px-3 py-2 text-xs font-bold text-amber-900 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-200">
          Development mode — no email was sent. Your code is{' '}
          <span className="font-mono tracking-widest">{devCode}</span>.
        </p>
      )}

      <fieldset>
        <legend className="sr-only">Verification code</legend>
        <div className="flex items-center justify-between gap-2">
          {digits.map((digit, index) => (
            <input
              key={index}
              ref={(node) => {
                inputs.current[index] = node;
              }}
              value={digit}
              onChange={(event) => setDigit(index, event.target.value)}
              onKeyDown={(event) => onKeyDown(index, event)}
              inputMode="numeric"
              autoComplete={index === 0 ? 'one-time-code' : 'off'}
              maxLength={CODE_LENGTH}
              aria-label={`Digit ${index + 1} of ${CODE_LENGTH}`}
              aria-invalid={error ? true : undefined}
              className="h-14 w-full min-w-0 rounded-2xl border-2 border-slate-300 bg-white text-center font-mono text-2xl font-black text-slate-900 outline-none transition-colors focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
            />
          ))}
        </div>
      </fieldset>

      <p aria-live="polite" className="min-h-5 text-xs font-bold">
        {error && <span className="text-rose-600 dark:text-rose-400">{error}</span>}
        {!error && notice && <span className="text-emerald-700 dark:text-emerald-400">{notice}</span>}
        {!error && !notice && secondsLeft > 0 && (
          <span className="text-slate-500 dark:text-slate-400">This code expires in {clock}.</span>
        )}
        {!error && !notice && secondsLeft === 0 && (
          <span className="text-amber-700 dark:text-amber-400">That code has expired — ask for a new one.</span>
        )}
      </p>

      <button
        type="submit"
        disabled={!complete || busy}
        className="flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-4 text-sm font-black text-white transition-colors hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
        {busy ? 'Checking…' : 'Verify and sign in'}
      </button>

      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={cancel}
          className="inline-flex min-h-9 items-center gap-1.5 rounded-xl px-2 text-xs font-bold text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Use a different account
        </button>
        <button
          type="button"
          onClick={resend}
          disabled={busy}
          className="min-h-9 rounded-xl px-2 text-xs font-bold text-indigo-600 hover:text-indigo-800 disabled:opacity-50 dark:text-indigo-400 dark:hover:text-indigo-300"
        >
          Send a new code
        </button>
      </div>
    </form>
  );
};

export default VerificationCodeForm;
