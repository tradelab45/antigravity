import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  BarChart3,
  BookOpen,
  ChevronDown,
  CircleHelp,
  Download,
  GraduationCap,
  LifeBuoy,
  LockKeyhole,
  MessageSquareText,
  NotebookTabs,
  PieChart,
  Search,
  ShieldCheck,
  Smartphone,
  Star,
  Wallet,
  Wifi,
} from 'lucide-react';
import type { AppTabType } from './Header';
import { useSimulator } from '../context/SimulatorContext';

interface HelpSupportCenterProps {
  setActiveTab: (tab: AppTabType) => void;
}

const FEATURE_LINKS: Array<{ title: string; detail: string; tab: AppTabType; Icon: React.ElementType; keywords: string }> = [
  { title: 'Find a company', detail: 'Search, filter and compare the curated market list.', tab: 'screener', Icon: BarChart3, keywords: 'market stock screener company price sector' },
  { title: 'Manage my watchlist', detail: 'Sort ideas, save notes and configure learning alerts.', tab: 'watchlist', Icon: Star, keywords: 'watchlist note alert favourite' },
  { title: 'Place a simulated trade', detail: 'Open Markets, select a company and build a risk-first trade plan.', tab: 'screener', Icon: Wallet, keywords: 'buy sell order trade stop loss target catalyst' },
  { title: 'Understand portfolio risk', detail: 'Review allocation, concentration and scenario impact.', tab: 'portfolio', Icon: PieChart, keywords: 'portfolio risk heatmap allocation sector scenario' },
  { title: 'Continue learning', detail: 'Resume lessons, bookmarks, quizzes and historical cases.', tab: 'academy', Icon: BookOpen, keywords: 'academy lesson quiz bookmark case study hindi' },
  { title: 'Review a decision', detail: 'Use the journal, emotions, screenshots and weekly reflection.', tab: 'journal', Icon: NotebookTabs, keywords: 'journal review screenshot emotion mistake reflection' },
  { title: 'Check progress', detail: 'See evidence-based XP, badges and practice benchmarks.', tab: 'badges', Icon: GraduationCap, keywords: 'xp badge rank leaderboard achievement progress' },
  { title: 'Export my records', detail: 'Download portfolio, journal, Academy and watchlist data.', tab: 'privacy', Icon: LockKeyhole, keywords: 'privacy export download backup data records' },
];

const FAQS = [
  { category: 'Getting started', question: 'Is RupeeRookie using real money?', answer: 'No. Every order uses virtual capital inside an educational simulator. Nothing in the app places a real exchange order or provides investment advice.' },
  { category: 'Market data', question: 'Why can a price look delayed or different?', answer: 'Figures may be delayed, last-close or simulated fallback values. Check the label and timestamp beside the figure before using it for a lesson or decision.' },
  { category: 'Portfolio', question: 'Why are XIRR, alpha or beta unavailable?', answer: 'Professional return and risk statistics require enough dated cash flows and a period-matched benchmark. RupeeRookie hides them until the required history exists rather than inventing a value.' },
  { category: 'Progress', question: 'Why is my leaderboard rank locked?', answer: 'A rank needs genuine evidence: complete at least three lessons or close five simulated trades. Benchmark profiles are clearly labelled as simulated practice comparisons.' },
  { category: 'Account', question: 'Why was I signed out?', answer: 'For privacy, the app signs out an account after seven days without activity. Your device-local learning records remain associated with your account unless browser data is cleared.' },
  { category: 'Data & privacy', question: 'Where are screenshots and journal notes stored?', answer: 'They stay in this browser on this device. Cloud sync is off, so export a backup before clearing browser data or moving to another device.' },
  { category: 'Mobile', question: 'Where are Replay, Trader DNA and other features on mobile?', answer: 'Open More in the bottom navigation or use the burger menu in the header. Both group additional features by Discover, Practice, Learn, Progress and Support.' },
  { category: 'AI Coach', question: 'What happens if AI is unavailable?', answer: 'The coach should show its availability state. When an AI provider is not configured, use the built-in educational explanations and never assume a response used live sources.' },
];

export const HelpSupportCenter: React.FC<HelpSupportCenterProps> = ({ setActiveTab }) => {
  const { currentUser, nseMarketInfo, stocks, notifyUser } = useSimulator();
  const [query, setQuery] = useState('');
  const [openQuestion, setOpenQuestion] = useState<string | null>(null);

  const normalizedQuery = query.trim().toLowerCase();
  const featureResults = useMemo(() => FEATURE_LINKS.filter((item) => !normalizedQuery || `${item.title} ${item.detail} ${item.keywords}`.toLowerCase().includes(normalizedQuery)), [normalizedQuery]);
  const faqResults = useMemo(() => FAQS.filter((item) => !normalizedQuery || `${item.category} ${item.question} ${item.answer}`.toLowerCase().includes(normalizedQuery)), [normalizedQuery]);

  const downloadDiagnosticReport = () => {
    const report = {
      generatedAt: new Date().toISOString(),
      app: 'RupeeRookie',
      page: new URLSearchParams(window.location.search).get('view') || 'home',
      signedIn: Boolean(currentUser),
      marketState: nseMarketInfo.isNSEMarketOpen ? 'NSE_OPEN' : 'NSE_CLOSED',
      companiesLoaded: stocks.length,
      online: navigator.onLine,
      viewport: { width: window.innerWidth, height: window.innerHeight },
      note: 'This report excludes passwords, journal text, screenshots and portfolio contents.',
    };
    const url = URL.createObjectURL(new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' }));
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `rupeerookie-diagnostic-${new Date().toISOString().slice(0, 10)}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
    notifyUser('Diagnostic report downloaded', 'The report contains app status only—no private notes, screenshots or passwords.', 'SUCCESS');
  };

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-slate-950 via-indigo-950 to-violet-950 p-6 text-white shadow-xl sm:p-8">
        <div className="absolute -right-20 -top-24 h-64 w-64 rounded-full bg-indigo-500/25 blur-3xl" />
        <div className="relative max-w-3xl">
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.18em] text-indigo-300"><LifeBuoy className="h-4 w-4" /> Help &amp; Support</div>
          <h1 className="mt-3 text-2xl font-black tracking-tight sm:text-4xl">What would you like to do?</h1>
          <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-300">Find any feature, understand how the simulator works, or prepare a privacy-safe diagnostic report when something is not working.</p>
          <label className="relative mt-6 block max-w-2xl">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search: stop-loss, Hindi lessons, export, alerts…" className="min-h-14 w-full rounded-2xl border border-white/15 bg-white/10 pl-12 pr-4 text-sm font-bold text-white outline-none backdrop-blur placeholder:text-slate-400 focus:border-indigo-300 focus:bg-white/15" />
          </label>
        </div>
      </section>

      <section aria-labelledby="feature-finder-title">
        <div className="mb-3 flex items-end justify-between gap-3"><div><h2 id="feature-finder-title" className="text-lg font-black">Feature finder</h2><p className="text-xs text-slate-500 dark:text-slate-400">Go directly to the right workspace.</p></div><span className="text-[10px] font-black uppercase text-slate-400">{featureResults.length} matches</span></div>
        {featureResults.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {featureResults.map(({ title, detail, tab, Icon }) => (
              <button key={title} type="button" onClick={() => setActiveTab(tab)} className="group min-h-36 rounded-3xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-300 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900 dark:hover:border-indigo-700">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-700 group-hover:bg-indigo-600 group-hover:text-white dark:bg-indigo-950 dark:text-indigo-300"><Icon className="h-5 w-5" /></span>
                <span className="mt-4 block text-sm font-black">{title}</span><span className="mt-1 block text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">{detail}</span>
              </button>
            ))}
          </div>
        ) : <div className="rounded-3xl border border-dashed border-slate-300 p-8 text-center text-sm font-bold text-slate-500 dark:border-slate-700">No feature matches. Try a simpler word such as “trade,” “lesson,” or “export.”</div>}
      </section>

      <div className="grid gap-5 lg:grid-cols-[1.35fr_.65fr]">
        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6" aria-labelledby="faq-title">
          <div className="flex items-center gap-2"><CircleHelp className="h-5 w-5 text-indigo-600" /><h2 id="faq-title" className="text-lg font-black">Frequently asked questions</h2></div>
          <div className="mt-4 divide-y divide-slate-100 dark:divide-slate-800">
            {faqResults.map((item) => {
              const open = openQuestion === item.question;
              return <article key={item.question} className="py-2"><button type="button" onClick={() => setOpenQuestion(open ? null : item.question)} aria-expanded={open} className="flex min-h-12 w-full items-center justify-between gap-3 text-left"><span><span className="block text-[9px] font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-300">{item.category}</span><span className="mt-0.5 block text-sm font-black">{item.question}</span></span><ChevronDown className={`h-4 w-4 shrink-0 text-slate-400 transition ${open ? 'rotate-180' : ''}`} /></button>{open && <p className="pb-3 pr-7 text-xs leading-6 text-slate-600 dark:text-slate-300">{item.answer}</p>}</article>;
            })}
            {faqResults.length === 0 && <p className="py-8 text-center text-sm font-bold text-slate-500">No FAQ matches that search.</p>}
          </div>
        </section>

        <aside className="space-y-4">
          <section className="rounded-3xl border border-emerald-200 bg-emerald-50 p-5 dark:border-emerald-900 dark:bg-emerald-950/25">
            <div className="flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-emerald-700" /><h2 className="text-sm font-black text-emerald-950 dark:text-emerald-100">Current app status</h2></div>
            <div className="mt-4 space-y-2 text-xs">
              <div className="flex items-center justify-between rounded-xl bg-white/70 p-3 dark:bg-slate-900/50"><span className="flex items-center gap-2"><Wifi className="h-4 w-4" /> Connection</span><strong>{navigator.onLine ? 'Online' : 'Offline'}</strong></div>
              <div className="flex items-center justify-between rounded-xl bg-white/70 p-3 dark:bg-slate-900/50"><span className="flex items-center gap-2"><BarChart3 className="h-4 w-4" /> Market</span><strong>{nseMarketInfo.isNSEMarketOpen ? 'Open' : 'Closed'}</strong></div>
              <div className="flex items-center justify-between rounded-xl bg-white/70 p-3 dark:bg-slate-900/50"><span className="flex items-center gap-2"><Smartphone className="h-4 w-4" /> Records</span><strong>Device-local</strong></div>
            </div>
          </section>

          <section className="rounded-3xl border border-amber-200 bg-amber-50 p-5 dark:border-amber-900 dark:bg-amber-950/25">
            <div className="flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-amber-700" /><h2 className="text-sm font-black text-amber-950 dark:text-amber-100">Something not working?</h2></div>
            <ol className="mt-3 space-y-2 text-xs leading-relaxed text-amber-950 dark:text-amber-100"><li>1. Confirm the local server is running.</li><li>2. Reload once and check the market-data label.</li><li>3. Export important device-local records before clearing browser data.</li></ol>
            <button type="button" onClick={downloadDiagnosticReport} className="mt-4 flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-amber-950 px-4 text-xs font-black text-white dark:bg-amber-200 dark:text-amber-950"><Download className="h-4 w-4" /> Download diagnostic report</button>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center gap-2"><MessageSquareText className="h-5 w-5 text-slate-500" /><h2 className="text-sm font-black">Support transparency</h2></div><p className="mt-2 text-xs leading-6 text-slate-500 dark:text-slate-400">Live ticket submission is not configured yet. The diagnostic download lets you share technical status deliberately without exposing private learning content.</p>
          </section>
        </aside>
      </div>
    </div>
  );
};
