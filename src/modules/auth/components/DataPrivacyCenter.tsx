import React, { useRef } from 'react';
import { Download, FileJson, LockKeyhole, Smartphone, UploadCloud, Upload, ShieldCheck, RefreshCw } from 'lucide-react';
import { useSimulator } from '../../../context/SimulatorContext';

function downloadFile(filename: string, content: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a'); link.href = url; link.download = filename; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function DataPrivacyCenter() {
  const { currentUser, holdings, orders, watchlist, completedLessonIds, userXP, alerts, notifyUser, backupPortfolio, restorePortfolioBackup } = useSimulator();
  const fileInputRef = useRef<HTMLInputElement>(null);
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

  const handleBackupPortfolio = () => {
    const backupJson = backupPortfolio();
    downloadFile('rupeerookie_portfolio_backup.json', backupJson, 'application/json');
    notifyUser('Portfolio Backed Up! 🛡️', 'rupeerookie_portfolio_backup.json downloaded successfully.', 'SUCCESS');
  };

  const handleFileRestore = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const result = restorePortfolioBackup(content);
        if (result.success) {
          notifyUser('Portfolio Restored! 🎉', result.message, 'SUCCESS');
        } else {
          notifyUser('Restore Failed ⚠️', result.message, 'WARNING');
        }
      }
    };
    reader.readAsText(file);
    // Reset file input so user can re-import if needed
    e.target.value = '';
  };

  return <div className="space-y-5">
    <section className="overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 to-indigo-950 p-6 text-white sm:p-8">
      <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.16em] text-indigo-300">
        <LockKeyhole className="h-4 w-4" /> Data & privacy
      </div>
      <h1 className="mt-3 text-2xl font-black sm:text-3xl">Your learning record belongs to you</h1>
      <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-300">
        Screenshots, journal notes, trade plans, watchlist notes and Academy progress stay in this browser on this device. They are not cloud-synced unless a future cloud-sync option is clearly enabled by you.
      </p>
      <div className="mt-5 flex flex-wrap items-center gap-3">
        <button type="button" onClick={exportAll} className="inline-flex min-h-12 items-center gap-2 rounded-2xl bg-white px-4 text-xs font-black text-slate-950 hover:bg-slate-100 transition-colors cursor-pointer">
          <FileJson className="h-4 w-4" /> Export everything
        </button>
        <button type="button" onClick={handleBackupPortfolio} className="inline-flex min-h-12 items-center gap-2 rounded-2xl bg-emerald-600 hover:bg-emerald-500 px-4 text-xs font-black text-white transition-colors cursor-pointer shadow-lg shadow-emerald-950/40">
          <ShieldCheck className="h-4 w-4" /> Backup Portfolio (rupeerookie_portfolio_backup.json)
        </button>
        <button type="button" onClick={() => fileInputRef.current?.click()} className="inline-flex min-h-12 items-center gap-2 rounded-2xl border border-indigo-400/40 bg-indigo-900/40 hover:bg-indigo-900/60 px-4 text-xs font-black text-indigo-200 transition-colors cursor-pointer">
          <Upload className="h-4 w-4" /> Restore Portfolio
        </button>
        <input ref={fileInputRef} type="file" accept=".json" className="hidden" onChange={handleFileRestore} />
      </div>
    </section>

    {/* Portfolio Snapshot Quick Restore Center */}
    <section className="rounded-3xl border border-indigo-200 bg-gradient-to-r from-indigo-50/70 to-slate-50 p-6 dark:border-indigo-900/50 dark:from-slate-900 dark:to-indigo-950/30">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-indigo-700 dark:text-indigo-400">
            <RefreshCw className="h-3.5 w-3.5" /> Instant Snapshot Recovery
          </span>
          <h2 className="mt-1 text-lg font-black text-slate-900 dark:text-white">Portfolio Backup & 1-Click Restore</h2>
          <p className="mt-1 text-xs text-slate-600 dark:text-slate-300 max-w-xl">
            Export a full JSON snapshot of your virtual cash balance, executed trades, open holdings, watchlist, and achievements. Import anytime to instantly recover your exact trading state.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleBackupPortfolio}
            className="px-4 py-2.5 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-950 text-xs font-black flex items-center gap-1.5 shadow-sm hover:opacity-90 transition-opacity cursor-pointer"
          >
            <Download className="h-4 w-4" /> Download Backup
          </button>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-black flex items-center gap-1.5 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer"
          >
            <Upload className="h-4 w-4" /> Restore JSON
          </button>
        </div>
      </div>
    </section>

    <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {datasets.map((dataset) => (
        <article key={dataset.file} className="rounded-3xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <Download className="h-5 w-5 text-indigo-600" />
          <h2 className="mt-3 text-sm font-black">{dataset.title}</h2>
          <p className="mt-1 min-h-10 text-[11px] leading-relaxed text-slate-500">{dataset.subtitle}</p>
          <button type="button" onClick={() => exportData(dataset.file, dataset.value)} className="mt-3 min-h-11 w-full rounded-xl border border-slate-200 text-xs font-black dark:border-slate-700 cursor-pointer">
            Export JSON
          </button>
        </article>
      ))}
    </section>

    <section className="grid gap-3 sm:grid-cols-2">
      <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-5 dark:border-emerald-900 dark:bg-emerald-950/20">
        <Smartphone className="h-5 w-5 text-emerald-700" />
        <h2 className="mt-2 text-sm font-black">Device-local by default</h2>
        <p className="mt-1 text-xs leading-relaxed">Clearing this browser’s site data or using a different device can remove or hide these records. Export a backup whenever the notes matter to you.</p>
      </div>
      <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-700 dark:bg-slate-800">
        <UploadCloud className="h-5 w-5 text-slate-500" />
        <h2 className="mt-2 text-sm font-black">Cloud sync is off</h2>
        <p className="mt-1 text-xs leading-relaxed">RupeeRookie does not silently upload screenshots or private notes. A future sync feature must show exactly what is shared and ask for explicit consent.</p>
      </div>
    </section>
  </div>;
}
