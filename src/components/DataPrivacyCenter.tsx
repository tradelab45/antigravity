import React from 'react';
import { Download, FileJson, LockKeyhole, Smartphone, UploadCloud } from 'lucide-react';
import { useSimulator } from '../context/SimulatorContext';
import { ChangePasswordPanel } from './ChangePasswordPanel';
import { DeleteAccountPanel } from './DeleteAccountPanel';

function downloadFile(filename: string, content: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a'); link.href = url; link.download = filename; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function DataPrivacyCenter() {
  const { currentUser, holdings, orders, watchlist, completedLessonIds, userXP, alerts, notifyUser } = useSimulator();
  const id = currentUser?.id || 'guest';
  const read = (key: string, fallback: unknown) => { try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback)); } catch { return fallback; } };
  const datasets = [
    { title: 'Portfolio activity', subtitle: 'Orders and current simulated holdings', file: 'portfolio-activity', value: { exportedAt: new Date().toISOString(), holdings, orders } },
    { title: 'Trade journal', subtitle: 'Reviews, emotions, tags and screenshot annotations', file: 'trade-journal', value: read(`rr_trade_reviews:${id}`, {}) },
    { title: 'Academy progress', subtitle: 'Completed lessons, bookmarks and XP', file: 'academy-progress', value: { completedLessonIds, userXP, workspace: read(`rr_academy_workspace:${id}:bookmarks`, []) } },
    { title: 'Weekly report', subtitle: 'A portable learning snapshot', file: 'weekly-learning-report', value: { exportedAt: new Date().toISOString(), completedLessons: completedLessonIds.length, journalReviews: read(`rr_trade_reviews:${id}`, {}), activeAlerts: alerts.filter((item) => item.active).length } },
    { title: 'Watchlist notes', subtitle: 'Symbols and “Why I’m watching” notes', file: 'watchlist-notes', value: { watchlist, notes: read(`rr_watchlist_workspace:${id}:notes`, {}) } },
  ];
  const exportData = (file: string, value: unknown) => { downloadFile(`rupeerookie-${file}.json`, JSON.stringify(value, null, 2), 'application/json'); notifyUser('Export ready', `${file.replaceAll('-', ' ')} was saved as JSON.`, 'SUCCESS'); };
  const exportAll = () => exportData('complete-device-export', { profile: currentUser, datasets: Object.fromEntries(datasets.map((dataset) => [dataset.file, dataset.value])) });

  return <div className="space-y-5"><section className="overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 to-indigo-950 p-6 text-white sm:p-8"><div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.16em] text-indigo-300"><LockKeyhole className="h-4 w-4" /> Data & privacy</div><h1 className="mt-3 text-2xl font-black sm:text-3xl">Your learning record belongs to you</h1><p className="mt-2 max-w-2xl text-sm leading-7 text-slate-300">Screenshots, journal notes, trade plans, watchlist notes and Academy progress stay in this browser on this device. Your account itself — name, email and sign-in details — is held on the RupeeRookie server, and joining a class board also sends it the figures that board shows. Nothing else is cloud-synced unless a future option is clearly enabled by you.</p><button type="button" onClick={exportAll} className="mt-5 inline-flex min-h-12 items-center gap-2 rounded-2xl bg-white px-4 text-xs font-black text-slate-950"><FileJson className="h-4 w-4" /> Export everything</button></section>
    <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{datasets.map((dataset) => <article key={dataset.file} className="rounded-3xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"><Download className="h-5 w-5 text-indigo-600" /><h2 className="mt-3 text-sm font-black">{dataset.title}</h2><p className="mt-1 min-h-10 text-[11px] leading-relaxed text-slate-500">{dataset.subtitle}</p><button type="button" onClick={() => exportData(dataset.file, dataset.value)} className="mt-3 min-h-11 w-full rounded-xl border border-slate-200 text-xs font-black dark:border-slate-700">Export JSON</button></article>)}</section>
    <section className="grid gap-3 sm:grid-cols-2"><div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-5 dark:border-emerald-900 dark:bg-emerald-950/20"><Smartphone className="h-5 w-5 text-emerald-700" /><h2 className="mt-2 text-sm font-black">Device-local by default</h2><p className="mt-1 text-xs leading-relaxed">Clearing this browser’s site data or using a different device can remove or hide these records. Export a backup whenever the notes matter to you.</p></div><div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-700 dark:bg-slate-800"><UploadCloud className="h-5 w-5 text-slate-500" /><h2 className="mt-2 text-sm font-black">Cloud sync is off</h2><p className="mt-1 text-xs leading-relaxed">RupeeRookie does not silently upload screenshots or private notes. A future sync feature must show exactly what is shared and ask for explicit consent.</p></div></section>
    <ChangePasswordPanel />
    <DeleteAccountPanel />
  </div>;
}
