import React, { useCallback, useEffect, useState } from 'react';
import { RefreshCw, Swords, Trophy, Users, LogOut } from 'lucide-react';

interface Membership { name: string; kind: 'SCHOOL' | 'COLLEGE'; alias: string }
interface Row { alias: string; rank: number; score: number; stagesPassed: number; isYou: boolean }
interface Board { rows: Row[]; total: number; yourRank: Row | null }

export function CohortLeaderboard({ userId, onBattle }: { userId?: string; onBattle: () => void }) {
  const [membership, setMembership] = useState<Membership | null>(null);
  const [board, setBoard] = useState<Board | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [form, setForm] = useState({ name: '', kind: 'SCHOOL', alias: '', code: '' });
  const request = useCallback(async (route: string, method = 'GET', body?: unknown) => {
    const response = await fetch(`/api/academy/${route}`, { method, headers: { 'Content-Type': 'application/json', 'x-academy-user': userId || '' }, ...(method !== 'GET' ? { body: JSON.stringify(body || {}) } : {}) });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Leaderboard unavailable.');
    return data;
  }, [userId]);
  const refresh = useCallback(async () => {
    setLoading(true); setMessage('');
    try {
      const me = await request('me'); setMembership(me.membership);
      setBoard(me.membership ? await request('leaderboard') : null);
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Connect to the internet to load rankings.'); }
    finally { setLoading(false); }
  }, [request]);
  useEffect(() => {
    void refresh();
    const update = () => void refresh();
    window.addEventListener('rr-academy-synced', update);
    return () => window.removeEventListener('rr-academy-synced', update);
  }, [refresh]);
  const join = async (event: React.FormEvent) => {
    event.preventDefault(); setLoading(true); setMessage('');
    try { await request('cohort', 'POST', form); setForm(previous => ({ ...previous, code: '' })); await refresh(); }
    catch (error) { setMessage(error instanceof Error ? error.message : 'Could not join.'); }
    finally { setLoading(false); }
  };
  const leave = async () => {
    setLoading(true);
    try { await request('cohort', 'DELETE'); setMembership(null); setBoard(null); setMessage('You have left the leaderboard.'); }
    catch { setMessage('Could not leave. Please reconnect and try again.'); }
    finally { setLoading(false); }
  };
  const input = 'mt-1 block w-full rounded border border-slate-300 bg-white p-2 text-sm dark:border-slate-600 dark:bg-slate-900';
  return <section aria-label="School and college leaderboard" className="border-t border-slate-200 py-5 text-slate-900 dark:border-slate-700 dark:text-white">
    <div className="flex items-center justify-between gap-3"><h3 className="flex items-center gap-2 text-base font-bold"><Trophy size={20} /> School / college leaderboard</h3><button type="button" disabled={loading} onClick={() => void refresh()} title="Refresh leaderboard" aria-label="Refresh leaderboard" className="p-2"><RefreshCw size={18} /></button></div>
    <p className="mt-2 text-xs text-slate-600 dark:text-slate-300">Best score per stage, added together: up to 120 points. Server-graded, unproctored practice. Only your nickname and scores are visible to your group.</p>
    <p role="status" className="mt-2 text-sm">{loading ? 'Loading...' : message}</p>
    {!membership ? <form onSubmit={join} className="mt-4 grid gap-3 sm:grid-cols-2">
      <label className="text-xs font-semibold">Institution type<select value={form.kind} onChange={e => setForm({ ...form, kind: e.target.value })} className={input}><option value="SCHOOL">School</option><option value="COLLEGE">College</option></select></label>
      <label className="text-xs font-semibold">School / college name<input required minLength={2} maxLength={80} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className={input} /></label>
      <label className="text-xs font-semibold">Nickname<input required minLength={2} maxLength={30} autoComplete="off" value={form.alias} onChange={e => setForm({ ...form, alias: e.target.value })} className={input} /></label>
      <label className="text-xs font-semibold">Private group code<input required minLength={8} maxLength={40} pattern="[a-zA-Z0-9-]{8,40}" type="password" autoComplete="off" value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} className={input} /></label>
      <p className="text-xs text-slate-600 dark:text-slate-300 sm:col-span-2">Use the same institution name and code as your classmates, or choose a new code to start a group. Groups are self-organised, not institution-verified.</p>
      <button type="submit" disabled={loading || !userId} className="flex items-center justify-center gap-2 rounded bg-emerald-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"><Users size={16} /> Join & share my scores</button>
    </form> : <>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-2"><h4 className="break-words font-semibold">{membership.name}</h4><button type="button" onClick={() => void leave()} disabled={loading} className="flex items-center gap-1 text-xs underline"><LogOut size={14} /> Leave group</button></div>
      {board && <>
        <p className="mt-1 text-xs">{board.total} learner{board.total === 1 ? '' : 's'}{board.yourRank ? ` · Your rank: ${board.yourRank.rank}` : ''}</p>
        <table className="mt-3 w-full text-left text-sm"><caption className="sr-only">Top 50 learners, equal scores share rank</caption><thead><tr className="border-b border-slate-300"><th className="py-2">Rank</th><th>Nickname</th><th>Score</th><th>Stages</th></tr></thead><tbody>{board.rows.map((row, i) => <tr key={i} className={`border-b border-slate-200 dark:border-slate-700 ${row.isYou ? 'font-bold' : ''}`}><td className="py-3">{row.rank}</td><td className="max-w-40 break-words pr-2">{row.alias}{row.isYou ? ' (you)' : ''}</td><td>{row.score}/120</td><td>{row.stagesPassed}/6</td></tr>)}</tbody></table>
        {board.total === 1 && <p className="mt-3 text-xs text-slate-600 dark:text-slate-300">You are the first learner in this group. No other rankings yet.</p>}
      </>}
      <button type="button" onClick={onBattle} className="mt-4 flex items-center gap-2 rounded bg-indigo-700 px-4 py-2 text-sm font-semibold text-white"><Swords size={16} /> Practise in the 1v1 stock battle</button>
    </>}
  </section>;
}
