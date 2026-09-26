import React, { lazy, Suspense, useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Lock, ShieldAlert, ArrowLeft } from 'lucide-react';
import { SimulatorProvider, useSimulator, isUserAdmin } from './context/SimulatorContext';
import { ThemeProvider } from './context/ThemeContext';
import type { AppTabType } from './components/Header';
import { PageSkeleton } from './components/PageSkeleton';
import { ToastNotifier } from './components/ToastNotifier';
import { ErrorBoundary } from './components/ErrorBoundary';
import { MobileBottomNav } from './components/MobileBottomNav';
import { ContextualGlossary } from './components/ContextualGlossary';
import { AccessibilityCenter } from './modules/accessibility/components/AccessibilityCenter';
import { AccessibilityProvider } from './modules/accessibility/context/AccessibilityContext';
import { DailyTipOverlay, getDailyTipStorageKey } from './components/DailyTipOverlay';
import { CommandPalette } from './components/CommandPalette';
import { FloatingQuickDock } from './components/FloatingQuickDock';
import { ConnectionStatus } from './components/ConnectionStatus';
import { PracticeTaskBanner } from './components/PracticeTaskBanner';
import type { StockDetail } from './types';

const Header = lazy(() => import('./components/Header').then((module) => ({ default: module.Header })));
const AuthPage = lazy(() => import('./components/AuthPage').then((module) => ({ default: module.AuthPage })));
const LandingPage = lazy(() => {
  const isClassic = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('classic') === 'true';
  return isClassic
    ? import('./components/LandingPage').then((module) => ({ default: module.LandingPage }))
    : import('./components/LandingPage3D').then((module) => ({ default: module.LandingPage3D }));
});
const PortfolioHub = lazy(() => import('./components/PortfolioHub').then((module) => ({ default: module.PortfolioHub })));
const MarketScreener = lazy(() => import('./components/MarketScreener').then((module) => ({ default: module.MarketScreener })));
const InvestorAcademy = lazy(() => import('./components/InvestorAcademy').then((module) => ({ default: module.InvestorAcademy })));
const ChanakyaMentor = lazy(() => import('./components/ChanakyaMentor').then((module) => ({ default: module.ChanakyaMentor })));
const StockDetailModal = lazy(() => import('./modules/market-data/components/StockDetailModal').then((module) => ({ default: module.StockDetailModal })));
const ReplayTerminal = lazy(() => import('./components/ReplayTerminal').then((module) => ({ default: module.ReplayTerminal })));
const TradeReviewHub = lazy(() => import('./components/TradeReviewHub').then((module) => ({ default: module.TradeReviewHub })));
const ProgressHub = lazy(() => import('./components/ProgressHub').then((module) => ({ default: module.ProgressHub })));
const CompoundCalculator = lazy(() => import('./modules/tax/components/CompoundCalculator').then((module) => ({ default: module.CompoundCalculator })));
const AppWalkthroughOverlay = lazy(() => import('./components/AppWalkthroughOverlay').then((module) => ({ default: module.AppWalkthroughOverlay })));
const CompleteProfileModal = lazy(() => import('./components/CompleteProfileModal').then((module) => ({ default: module.CompleteProfileModal })));
const HomeDashboard = lazy(() => import('./components/HomeDashboard').then((module) => ({ default: module.HomeDashboard })));
const DataPrivacyCenter = lazy(() => import('./components/DataPrivacyCenter').then((module) => ({ default: module.DataPrivacyCenter })));
const HelpSupportCenter = lazy(() => import('./components/HelpSupportCenter').then((module) => ({ default: module.HelpSupportCenter })));
const StockBattleModal = lazy(() => import('./components/StockBattleModal').then((module) => ({ default: module.StockBattleModal })));
const OptionsChainModal = lazy(() => import('./modules/market-data/components/OptionsChainModal').then((module) => ({ default: module.OptionsChainModal })));
const AdminDashboard = lazy(() => import('./components/AdminDashboard').then((module) => ({ default: module.AdminDashboard })));
const BigQueryGraphView = lazy(() => import('./modules/market-data/components/BigQueryGraphView').then((module) => ({ default: module.BigQueryGraphView })));

const checkIsAdminPortal = (): boolean => {
  if (typeof window === 'undefined') return false;
  const path = window.location.pathname.toLowerCase();
  const search = new URLSearchParams(window.location.search);
  const hash = window.location.hash.toLowerCase();
  return (
    path === '/admin' || 
    path.startsWith('/admin/') || 
    search.get('portal') === 'admin' || 
    search.get('view') === 'admin' || 
    hash === '#/admin' || 
    hash === '#admin'
  );
};

function PageLoadingState() {
  return (
    <div role="status" aria-live="polite" className="min-h-[360px] rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-center">
      <div className="text-center">
        <div className="mx-auto h-9 w-9 rounded-full border-2 border-indigo-200 border-t-indigo-600 animate-spin" />
        <p className="mt-3 text-xs font-bold text-slate-500 dark:text-slate-400">Preparing your workspace…</p>
      </div>
    </div>
  );
}

function AdminAccessDenied({ onSwitchToApp, onUnlock }: { onSwitchToApp: () => void; onUnlock: () => void }) {
  const [passkey, setPasskey] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleAttemptUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passkey.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/verify-passkey', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passkey: passkey.trim() })
      });
      // The server is the only judge of the passkey. This used to also accept
      // two hardcoded values, and to grant access on those same values when
      // the request failed — which shipped the passkeys in the bundle and
      // opened the console without the server ever agreeing.
      if (res.ok) {
        localStorage.setItem('rr_admin_auth', 'authorized');
        sessionStorage.setItem('rr_admin_auth', 'authorized');
        onUnlock();
      } else {
        const d = await res.json().catch(() => null);
        setError(d?.message || 'Access Denied: Invalid security passkey.');
      }
    } catch {
      setError('Could not reach the server to verify the passkey.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-slate-950 text-white flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans">
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
        <div className="w-[500px] h-[500px] rounded-full bg-rose-600/15 blur-[150px]" />
      </div>

      <div className="relative z-10 w-full max-w-md p-6 sm:p-8 rounded-3xl border border-rose-500/25 bg-slate-900/90 shadow-2xl backdrop-blur-xl text-center">
        <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 mx-auto flex items-center justify-center mb-5 shadow-lg shadow-rose-950/50">
          <Lock className="w-8 h-8 text-rose-500 animate-pulse" />
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-500/15 text-rose-400 border border-rose-500/30 mb-3">
          <ShieldAlert className="w-3.5 h-3.5" />
          <span>403 Restricted Clearance</span>
        </div>

        <h1 className="text-xl font-black text-white">Owner Access Only</h1>
        <p className="mt-2 text-xs text-slate-400 leading-relaxed">
          The RupeeRookie Executive Command Center is strictly confidential and reserved exclusively for the platform owner (<strong className="text-slate-200">Aarav Jain</strong>).
        </p>

        {error && (
          <div className="mt-4 p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-semibold text-left">
            {error}
          </div>
        )}

        <form onSubmit={handleAttemptUnlock} className="mt-5 space-y-3">
          <div className="relative">
            <input
              type="password"
              value={passkey}
              onChange={(e) => setPasskey(e.target.value)}
              placeholder="Enter Master Owner Passkey..."
              className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
            />
          </div>
          <button
            type="submit"
            disabled={loading || !passkey.trim()}
            className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition-all disabled:opacity-50 cursor-pointer shadow-md"
          >
            {loading ? 'Verifying Clearance...' : 'Authenticate Platform Owner'}
          </button>
        </form>

        <div className="mt-6 pt-5 border-t border-slate-800">
          <button
            type="button"
            onClick={onSwitchToApp}
            className="inline-flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to RupeeRookie Trading App</span>
          </button>
        </div>
      </div>
    </div>
  );
}

function SimulatorApp() {
  const { currentUser, stocks, broadcastAnnouncement, dismissBroadcast, notifyUser } = useSimulator();
  const [isPortalAdmin, setIsPortalAdmin] = useState<boolean>(checkIsAdminPortal);
  const [adminBypassAuth, setAdminBypassAuth] = useState(false);


  useEffect(() => {
    const handlePopState = () => {
      setIsPortalAdmin(checkIsAdminPortal());
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleSwitchToApp = () => {
    setIsPortalAdmin(false);
    const url = new URL(window.location.href);
    if (url.pathname.startsWith('/admin')) {
      url.pathname = '/';
    }
    url.searchParams.delete('portal');
    if (url.searchParams.get('view') === 'admin') {
      url.searchParams.set('view', 'home');
    }
    url.hash = '';
    window.history.pushState({}, '', url);
  };

  const handleSwitchToAdmin = () => {
    setIsPortalAdmin(true);
    const url = new URL(window.location.href);
    url.pathname = '/admin';
    url.searchParams.delete('portal');
    url.hash = '';
    window.history.pushState({}, '', url);
  };

  const [publicScreen, setPublicScreen] = useState<'LANDING' | 'LOGIN' | 'SIGNUP'>(() => {
    const params = new URLSearchParams(window.location.search);
    const authParam = params.get('auth') || params.get('mode');
    if (authParam === 'login' || authParam === 'signin') return 'LOGIN';
    if (authParam === 'signup' || authParam === 'register') return 'SIGNUP';
    return 'LANDING';
  });
  const [activeTab, setActiveTab] = useState<AppTabType>(() => {
    const requestedView = new URLSearchParams(window.location.search).get('view') as AppTabType | null;
    const supportedViews: AppTabType[] = ['home', 'screener', 'watchlist', 'portfolio', 'replay', 'review', 'journal', 'academy', 'challenges', 'calculator', 'chanakya', 'badges', 'privacy', 'help', 'graph'];
    return requestedView && supportedViews.includes(requestedView) ? requestedView : 'home';
  });
  const [selectedStock, setSelectedStock] = useState<StockDetail | null>(null);
  const [isWalkthroughOpen, setIsWalkthroughOpen] = useState<boolean>(false);
  const [isCompleteProfileOpen, setIsCompleteProfileOpen] = useState<boolean>(false);
  const [isDailyTipOpen, setIsDailyTipOpen] = useState(false);
  const [isBattleOpen, setIsBattleOpen] = useState<boolean>(false);
  const [isOptionsOpen, setIsOptionsOpen] = useState<boolean>(false);
  const [authLaunchState, setAuthLaunchState] = useState<{ kind: 'new' | 'returning' } | null>(() => {
    try {
      const entry = JSON.parse(localStorage.getItem('rr_auth_entry') || 'null') as { kind?: 'new' | 'returning'; userId?: string; at?: number } | null;
      if (entry?.userId === currentUser?.id && entry.at && Date.now() - entry.at < 12_000) {
        return { kind: entry.kind || 'returning' };
      }
    } catch { /* Invalid legacy entry is cleared after mount. */ }
    return null;
  });

  useEffect(() => {
    const handleOpenBattle = () => setIsBattleOpen(true);
    const handleOpenOptions = () => setIsOptionsOpen(true);
    const handleOpenStockDetail = (e: Event) => {
      const stock = (e as CustomEvent).detail;
      if (stock) setSelectedStock(stock);
    };
    window.addEventListener('open-stock-battle', handleOpenBattle);
    window.addEventListener('open-options-chain', handleOpenOptions);
    window.addEventListener('open-stock-detail', handleOpenStockDetail);
    return () => {
      window.removeEventListener('open-stock-battle', handleOpenBattle);
      window.removeEventListener('open-options-chain', handleOpenOptions);
      window.removeEventListener('open-stock-detail', handleOpenStockDetail);
    };
  }, []);

  // Discrete Platform Owner Shortcut: Ctrl + Shift + A (or Cmd + Shift + A)
  useEffect(() => {
    const handleAdminShortcut = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'A' || e.key === 'a')) {
        e.preventDefault();
        handleSwitchToAdmin();
      }
    };
    window.addEventListener('keydown', handleAdminShortcut);
    return () => window.removeEventListener('keydown', handleAdminShortcut);
  }, []);

  // Prevent background scrolling and eliminate layout shift when modals are active
  useEffect(() => {
    const isModalActive = Boolean(
      selectedStock ||
      isWalkthroughOpen ||
      isCompleteProfileOpen ||
      isDailyTipOpen ||
      isBattleOpen ||
      isOptionsOpen
    );
    if (isModalActive) {
      const prevOverflow = document.body.style.overflow;
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
      document.body.style.overflow = 'hidden';
      if (scrollbarWidth > 0) {
        document.body.style.paddingRight = `${scrollbarWidth}px`;
      }
      return () => {
        document.body.style.overflow = prevOverflow;
        document.body.style.paddingRight = '';
      };
    }
  }, [selectedStock, isWalkthroughOpen, isCompleteProfileOpen, isDailyTipOpen, isBattleOpen, isOptionsOpen]);

  useEffect(() => {
    const handleAuthSuccess = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      setAuthLaunchState({ kind: detail?.kind || 'returning' });
    };
    window.addEventListener('rr_auth_success', handleAuthSuccess);
    return () => window.removeEventListener('rr_auth_success', handleAuthSuccess);
  }, []);

  useEffect(() => {
    if (currentUser) {
      try {
        const entry = JSON.parse(localStorage.getItem('rr_auth_entry') || 'null');
        if (entry?.at && Date.now() - entry.at < 12_000) {
          setAuthLaunchState({ kind: entry.kind || 'returning' });
        }
      } catch {}
    }
  }, [currentUser]);

  // Signing in lands straight in the app. It used to stop on a full-screen
  // spinning coin — confetti, a countdown and a reload — for about four and a
  // half seconds every time, before anyone could see their own portfolio. The
  // greeting is now a message in the corner, and the walkthrough a new
  // account needs opens at once instead of after the coin had finished.
  useEffect(() => {
    if (!authLaunchState || !currentUser) return;
    const firstName = (currentUser.fullName || '').trim().split(/\s+/)[0] || 'there';
    if (authLaunchState.kind === 'new') {
      notifyUser(
        `Welcome, ${firstName}`,
        'Your ₹10,00,000 practice capital is ready. The short tour shows where everything is.',
        'SUCCESS',
      );
    } else {
      notifyUser(`Welcome back, ${firstName}`, 'Everything is where you left it.', 'SUCCESS');
    }
    localStorage.removeItem('rr_auth_entry');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLaunchState, currentUser?.id]);

  useEffect(() => {
    if (!currentUser) return;
    const url = new URL(window.location.href);
    url.searchParams.set('view', activeTab);
    window.history.replaceState({}, '', url);
  }, [activeTab, currentUser]);

  // Keep each workspace exactly where the learner left it when moving between sections.
  useEffect(() => {
    if (!currentUser) return;
    const savedPosition = Number(sessionStorage.getItem(`rr_scroll_${activeTab}`) || 0);
    const frame = window.requestAnimationFrame(() => window.scrollTo({ top: savedPosition, behavior: 'auto' }));
    return () => {
      window.cancelAnimationFrame(frame);
      sessionStorage.setItem(`rr_scroll_${activeTab}`, String(window.scrollY));
    };
  }, [activeTab, currentUser]);

  // As soon as someone logs in, give them the interactive guide, then put a popup of complete profile
  useEffect(() => {
    if (currentUser) {
      const sessionGuidedKey = `rr_guided_session_${currentUser.id}`;
      const hasGuidedThisSession = sessionStorage.getItem(sessionGuidedKey);

      if (!hasGuidedThisSession || authLaunchState?.kind === 'new') {
        sessionStorage.setItem(sessionGuidedKey, 'true');
        const timer = setTimeout(() => {
          setIsWalkthroughOpen(true);
        }, 500);
        return () => clearTimeout(timer);
      }

      const dailyTipKey = getDailyTipStorageKey(currentUser.id);
      if (!localStorage.getItem(dailyTipKey)) {
        const timer = window.setTimeout(() => {
          localStorage.setItem(dailyTipKey, 'true');
          setIsDailyTipOpen(true);
        }, 900);
        return () => window.clearTimeout(timer);
      }
    }
  }, [authLaunchState, currentUser]);

  const handleOpenChanakyaWithStock = (stock: StockDetail) => {
    setSelectedStock(null);
    setActiveTab('chanakya');
  };

  const hasAdminPrivilege = isUserAdmin(currentUser) || adminBypassAuth || (typeof window !== 'undefined' && (sessionStorage.getItem('rr_admin_auth') === 'authorized' || localStorage.getItem('rr_admin_auth') === 'authorized'));

  // Dedicated Standalone Admin Portal View with Strict Access Control
  if (isPortalAdmin) {
    if (!hasAdminPrivilege) {
      return <AdminAccessDenied onSwitchToApp={handleSwitchToApp} onUnlock={() => setAdminBypassAuth(true)} />;
    }
    return (
      <Suspense fallback={<PageLoadingState />}>
        <AdminDashboard onSwitchToApp={handleSwitchToApp} />
      </Suspense>
    );
  }

  // If not logged in, gate the entire app and show the dedicated full-screen Login / Signup page
  if (!currentUser) {
    return (
      <>
        <Suspense fallback={<PageLoadingState />}>
          {publicScreen === 'LANDING' ? <LandingPage onEnter={(mode, view) => {
            if (view) {
              setActiveTab(view);
              const url = new URL(window.location.href);
              url.searchParams.set('view', view);
              window.history.replaceState({}, '', url);
            }
            setPublicScreen(mode);
            window.scrollTo({ top: 0, behavior: 'instant' });
          }} /> : (
            <AuthPage 
              initialMode={publicScreen} 
              onBackToLanding={() => {
                setPublicScreen('LANDING');
                window.scrollTo({ top: 0, behavior: 'instant' });
              }} 
            />
          )}
        </Suspense>
        <ToastNotifier />
      </>
    );
  }

  return (
    <div className="rr-app-canvas min-h-screen max-w-full overflow-x-hidden text-slate-900 dark:text-slate-100 flex flex-col font-sans selection:bg-indigo-600 selection:text-white antialiased transition-colors duration-200">
      <a href="#main-content" className="skip-link">Skip to main content</a>
      {/* Top Fixed Header with live tickers & Net Worth */}
      <Suspense fallback={<div role="status" className="h-40 border-b border-slate-200 dark:border-slate-800"><span className="sr-only">Loading navigation…</span></div>}><Header 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        onStartWalkthrough={() => setIsWalkthroughOpen(true)}
        onSelectStock={(s) => setSelectedStock(s)}
        onOpenAdmin={handleSwitchToAdmin}
      /></Suspense>

      {/* Platform Emergency Announcement Broadcast Banner */}
      {broadcastAnnouncement && (
        <div className="w-full bg-gradient-to-r from-amber-600 via-orange-600 to-amber-600 text-white px-4 py-2 text-xs font-bold flex items-center justify-between shadow-md z-40 animate-fadeIn">
          <div className="max-w-[1640px] mx-auto w-full flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-black/25 text-[10px] uppercase tracking-wider font-black">
                {broadcastAnnouncement.title || 'Platform Announcement'}
              </span>
              <span>{broadcastAnnouncement.message}</span>
            </div>
            <button
              onClick={dismissBroadcast}
              className="text-white/80 hover:text-white px-2 py-0.5 rounded hover:bg-white/10 text-[11px] font-bold cursor-pointer"
            >
              Dismiss ✕
            </button>
          </div>
        </div>
      )}


      {/* Main Content Area - Expansive Desktop Layout with Fluid Mobile & Tablet Spacing */}
      <main id="main-content" tabIndex={-1} className="flex-1 max-w-[1640px] w-full mx-auto px-4 pb-28 sm:px-6 md:px-8 lg:px-10 xl:px-12 2xl:px-16 sm:pb-28 py-4 sm:py-6 lg:py-8 outline-none">
        <PracticeTaskBanner activeTab={activeTab} />
        <Suspense fallback={activeTab === 'screener' ? <PageSkeleton page="markets" /> : activeTab === 'portfolio' || activeTab === 'watchlist' ? <PageSkeleton page="portfolio" /> : activeTab === 'academy' ? <PageSkeleton page="academy" /> : <PageLoadingState />}>
          <AnimatePresence mode="wait">
          {activeTab === 'home' && (
            <motion.div key="home" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
              <HomeDashboard setActiveTab={setActiveTab} />
            </motion.div>
          )}
          {activeTab === 'screener' && (
            <motion.div key="screener" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
              <MarketScreener 
                onSelectStock={(stock) => setSelectedStock(stock)} 
              />
            </motion.div>
          )}

          {(activeTab === 'portfolio' || activeTab === 'watchlist') && (
            <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
              <PortfolioHub
                onSelectStock={(stock) => setSelectedStock(stock)}
                onNavigateToScreener={() => setActiveTab('screener')}
                initialSection={activeTab === 'watchlist' ? 'watchlist' : 'positions'}
              />
            </motion.div>
          )}

          {activeTab === 'replay' && (
            <motion.div key="replay" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
              <ReplayTerminal />
            </motion.div>
          )}

          {(activeTab === 'review' || activeTab === 'journal') && (
            <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
              <TradeReviewHub initialTab={activeTab === 'journal' ? 'JOURNAL' : 'DNA'} />
            </motion.div>
          )}

          {activeTab === 'academy' && (
            <motion.div key="academy" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
              <InvestorAcademy key={currentUser.id} setActiveTab={setActiveTab} />
            </motion.div>
          )}

          {(activeTab === 'challenges' || activeTab === 'badges') && (
            <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
              <ProgressHub initialSection={activeTab === 'badges' ? 'achievements' : 'challenges'} />
            </motion.div>
          )}

          {activeTab === 'calculator' && (
            <motion.div key="calculator" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
              <CompoundCalculator />
            </motion.div>
          )}

          {activeTab === 'chanakya' && (
            <motion.div key="chanakya" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
              <ChanakyaMentor />
            </motion.div>
          )}

          {activeTab === 'privacy' && (
            <motion.div key="privacy" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}><DataPrivacyCenter /></motion.div>
          )}
          {activeTab === 'help' && (
            <motion.div key="help" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}><HelpSupportCenter setActiveTab={setActiveTab} /></motion.div>
          )}
          {activeTab === 'graph' && (
            <motion.div key="graph" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
              <BigQueryGraphView />
            </motion.div>
          )}
          </AnimatePresence>
        </Suspense>
      </main>

      {/* Stock Deep Analysis & Trading Modal */}
      {selectedStock && (
        <Suspense fallback={null}>
          <StockDetailModal
            stock={selectedStock}
            onClose={() => setSelectedStock(null)}
            onOpenChanakyaWithContext={handleOpenChanakyaWithStock}
          />
        </Suspense>
      )}

      {/* 1v1 Blue-Chip Stock Battle Arena Modal */}
      {isBattleOpen && (
        <Suspense fallback={null}>
          <StockBattleModal
            isOpen={isBattleOpen}
            onClose={() => setIsBattleOpen(false)}
            onSelectStock={(s) => setSelectedStock(s)}
          />
        </Suspense>
      )}

      {/* Options Chain & Payoff Diagram Modal */}
      {isOptionsOpen && (
        <Suspense fallback={null}>
          <OptionsChainModal
            isOpen={isOptionsOpen}
            onClose={() => setIsOptionsOpen(false)}
          />
        </Suspense>
      )}

      {/* App Walkthrough Tutorial Overlay */}
      <Suspense fallback={null}>
        <AppWalkthroughOverlay
          isOpen={isWalkthroughOpen}
          onClose={() => {
            setIsWalkthroughOpen(false);
            // As soon as someone logins in give them the guide then put a popup of complete profile
            const profileKey = currentUser ? `rr_profile_completed_${currentUser.id}` : null;
            if (profileKey && !localStorage.getItem(profileKey)) {
              setTimeout(() => setIsCompleteProfileOpen(true), 350);
            }
          }}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
        />
      </Suspense>

      {/* Complete Profile Onboarding Popup Modal */}
      <Suspense fallback={null}>
        <CompleteProfileModal
          isOpen={isCompleteProfileOpen}
          onClose={() => setIsCompleteProfileOpen(false)}
        />
      </Suspense>

      {/* Global Notification Toast Container */}
      <ToastNotifier />
      <ConnectionStatus />
      <ContextualGlossary activeTab={activeTab} />
      <AccessibilityCenter />
      <FloatingQuickDock />
      <MobileBottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
      <CommandPalette
        stocks={stocks}
        onNavigate={setActiveTab}
        onSelectStock={(stock) => setSelectedStock(stock)}
      />

      <AnimatePresence>
        {isDailyTipOpen && currentUser && (
          <DailyTipOverlay
            user={currentUser}
            onClose={() => setIsDailyTipOpen(false)}
            onNavigate={(tab) => {
              setIsDailyTipOpen(false);
              setActiveTab(tab);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        )}
      </AnimatePresence>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-6 pb-24 lg:pb-6 text-xs text-slate-500 dark:text-slate-400 transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-indigo-600 to-violet-600 text-white font-black flex items-center justify-center text-xs shadow-xs">
              ₹
            </div>
            <span className="font-bold text-slate-900 dark:text-slate-100">RupeeRookie</span>
            <span>— Indian paper trading simulator & investor academy</span>
          </div>

          <div className="flex items-center gap-4 text-slate-500 dark:text-slate-400 font-medium flex-wrap justify-center">
            <span className="text-amber-700 dark:text-amber-300 font-semibold flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500"></span>
              Indicative, delayed or last-close NSE/BSE data
            </span>
            <span>•</span>
            <span className="text-slate-700 dark:text-slate-300 font-semibold">75+ Curated Indian Companies</span>
            <span>•</span>
            <span className="text-slate-700 dark:text-slate-300 font-semibold">₹10,00,000 Virtual Capital</span>
            <span>•</span>
            <span className="text-indigo-600 dark:text-indigo-400 font-semibold">Educational simulation — not investment advice</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AccessibilityProvider>
          <SimulatorProvider>
            <SimulatorApp />
          </SimulatorProvider>
        </AccessibilityProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
