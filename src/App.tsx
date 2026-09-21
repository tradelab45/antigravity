import React, { lazy, Suspense, useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { SimulatorProvider, useSimulator } from './context/SimulatorContext';
import { ThemeProvider } from './context/ThemeContext';
import type { AppTabType } from './components/Header';
import { PageSkeleton } from './components/PageSkeleton';
import { ToastNotifier } from './components/ToastNotifier';
import { ErrorBoundary } from './components/ErrorBoundary';
import { MobileBottomNav } from './components/MobileBottomNav';
import { ContextualGlossary } from './components/ContextualGlossary';
import { AccessibilityCenter } from './components/AccessibilityCenter';
import { AccessibilityProvider } from './context/AccessibilityContext';
import { DailyTipOverlay, getDailyTipStorageKey } from './components/DailyTipOverlay';
import { CommandPalette } from './components/CommandPalette';
import { FloatingQuickDock } from './components/FloatingQuickDock';
import { ConnectionStatus } from './components/ConnectionStatus';
import type { StockDetail } from './types';

const Header = lazy(() => import('./components/Header').then((module) => ({ default: module.Header })));
const AuthPage = lazy(() => import('./components/AuthPage').then((module) => ({ default: module.AuthPage })));
const AuthLaunchTransition = lazy(() => import('./components/AuthLaunchTransition').then((module) => ({ default: module.AuthLaunchTransition })));
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
const StockDetailModal = lazy(() => import('./components/StockDetailModal').then((module) => ({ default: module.StockDetailModal })));
const ReplayTerminal = lazy(() => import('./components/ReplayTerminal').then((module) => ({ default: module.ReplayTerminal })));
const TradeReviewHub = lazy(() => import('./components/TradeReviewHub').then((module) => ({ default: module.TradeReviewHub })));
const ProgressHub = lazy(() => import('./components/ProgressHub').then((module) => ({ default: module.ProgressHub })));
const CompoundCalculator = lazy(() => import('./components/CompoundCalculator').then((module) => ({ default: module.CompoundCalculator })));
const AppWalkthroughOverlay = lazy(() => import('./components/AppWalkthroughOverlay').then((module) => ({ default: module.AppWalkthroughOverlay })));
const CompleteProfileModal = lazy(() => import('./components/CompleteProfileModal').then((module) => ({ default: module.CompleteProfileModal })));
const HomeDashboard = lazy(() => import('./components/HomeDashboard').then((module) => ({ default: module.HomeDashboard })));
const DataPrivacyCenter = lazy(() => import('./components/DataPrivacyCenter').then((module) => ({ default: module.DataPrivacyCenter })));
const HelpSupportCenter = lazy(() => import('./components/HelpSupportCenter').then((module) => ({ default: module.HelpSupportCenter })));
const StockBattleModal = lazy(() => import('./components/StockBattleModal').then((module) => ({ default: module.StockBattleModal })));
const OptionsChainModal = lazy(() => import('./components/OptionsChainModal').then((module) => ({ default: module.OptionsChainModal })));
const AdminDashboard = lazy(() => import('./components/AdminDashboard').then((module) => ({ default: module.AdminDashboard })));

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

function SimulatorApp() {
  const { currentUser, stocks } = useSimulator();
  const [isPortalAdmin, setIsPortalAdmin] = useState<boolean>(checkIsAdminPortal);

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
    const supportedViews: AppTabType[] = ['home', 'screener', 'watchlist', 'portfolio', 'replay', 'review', 'journal', 'academy', 'challenges', 'calculator', 'chanakya', 'badges', 'privacy', 'help'];
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

      if (!hasGuidedThisSession || authLaunchState) {
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

  // Dedicated Standalone Admin Portal View
  if (isPortalAdmin) {
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

  // 3D Spinning & Wobbling Coin Post-Login Loading Experience
  if (authLaunchState) {
    return (
      <Suspense fallback={<PageLoadingState />}>
        <AuthLaunchTransition
          user={currentUser}
          kind={authLaunchState.kind}
          onEnter={() => {
            localStorage.removeItem('rr_auth_entry');
            setAuthLaunchState(null);
          }}
        />
      </Suspense>
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
      /></Suspense>

      {/* Main Content Area - Expansive Desktop Layout with Fluid Mobile & Tablet Spacing */}
      <main id="main-content" tabIndex={-1} className="flex-1 max-w-[1640px] w-full mx-auto px-4 pb-28 sm:px-6 md:px-8 lg:px-10 xl:px-12 2xl:px-16 sm:pb-28 py-4 sm:py-6 lg:py-8 outline-none">
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
              <InvestorAcademy />
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
