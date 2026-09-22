import React, { createContext, useContext, useState, useEffect, useMemo, useCallback, useRef } from 'react';
import type { Options as ConfettiOptions } from 'canvas-confetti';

// Celebration code is not needed at startup. A failed optional effect must never break a trade.
const confetti = (options: ConfettiOptions) => {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  void import('canvas-confetti').then(module => module.default(options)).catch(() => {});
};
import { 
  StockDetail, 
  Holding, 
  Order, 
  PortfolioSnapshot, 
  MarketIndices, 
  MarketNews, 
  Badge, 
  Alert, 
  AppNotification, 
  UserAccount, 
  AuthFormData,
  ProductType,
  BracketOrderParams,
  WatchlistGroup,
  OptionPosition,
  BroadcastAnnouncement
} from '../types';
import { INITIAL_BADGES } from '../data/lessonsData';
import { TOP_100_INDIAN_COMPANIES } from '../data/indianCompanies';
import { getNSEMarketTimeInfo, NSEMarketInfo } from '../utils/marketHours';
import { enrichStockWithTechnicalsAndDuPont } from '../utils/technicalCalculator';
import { computeMarketIndicesFromStocks } from '../utils/indexCalculator';
import { mergeQuote } from '../utils/quoteState';

export const ADMIN_EMAILS = ['aaravvjain23@gmail.com'];
export const ADMIN_USERNAMES = ['aaravvjain23@gmail.com', 'aarav', 'aarav_trader'];

export const isUserAdmin = (user: { email?: string; username?: string; isAdmin?: boolean; role?: string } | null | undefined): boolean => {
  if (!user) return false;
  const email = (user.email || '').trim().toLowerCase();
  const username = (user.username || '').trim().toLowerCase();
  if (ADMIN_EMAILS.includes(email) || ADMIN_USERNAMES.includes(username)) return true;
  if ((user.isAdmin === true || user.role === 'ADMIN') && ADMIN_EMAILS.includes(email)) return true;
  return false;
};

const INACTIVITY_TIMEOUT_MS = 7 * 24 * 60 * 60 * 1000;
const LAST_ACTIVITY_PREFIX = 'rr_last_activity:';

const getLastActivityKey = (userId: string) => `${LAST_ACTIVITY_PREFIX}${userId}`;

const readActiveUser = (): UserAccount | null => {
  const saved = localStorage.getItem('rr_current_user');
  if (!saved) return null;

  try {
    const user = JSON.parse(saved) as UserAccount;
    const activityKey = getLastActivityKey(user.id);
    const lastActivity = Number(localStorage.getItem(activityKey));

    if (lastActivity > 0 && Date.now() - lastActivity > INACTIVITY_TIMEOUT_MS) {
      localStorage.removeItem('rr_current_user');
      localStorage.removeItem(activityKey);
      localStorage.setItem('rr_logout_reason', 'inactive');
      return null;
    }

    if (!lastActivity) localStorage.setItem(activityKey, Date.now().toString());
    user.isAdmin = isUserAdmin(user);
    user.role = user.isAdmin ? 'ADMIN' : 'USER';
    return user;
  } catch {
    localStorage.removeItem('rr_current_user');
    return null;
  }
};


export interface CopilotFeedback {
  id: string;
  stock: StockDetail;
  action: 'BUY' | 'SELL';
  quantity: number;
  productType: ProductType;
  advice: string;
  suggestedStopLoss: number;
  suggestedTarget: number;
  riskRating: 'LOW' | 'MODERATE' | 'HIGH';
  timestamp: string;
}

interface SimulatorContextType {
  currentUser: UserAccount | null;
  loginUser: (identifier: string, password: string) => Promise<{ success: boolean; message: string; user?: UserAccount }>;
  registerUser: (data: AuthFormData) => Promise<{ success: boolean; message: string; user?: UserAccount }>;
  loginWithGoogle: (credential: string) => Promise<{ success: boolean; message: string; user?: UserAccount; isNew?: boolean }>;
  logoutUser: () => void;
  alerts: Alert[];
  addAlert: (symbol: string, targetPrice: number, type: 'ABOVE' | 'BELOW') => void;
  addSmartAlert: (alert: Omit<Alert, 'id' | 'active' | 'createdAt'>) => void;
  removeAlert: (id: string) => void;
  notifications: AppNotification[];
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  stocks: StockDetail[];
  selectedStock: StockDetail | null;
  setSelectedStock: (stock: StockDetail | null) => void;
  cashBalance: number;
  holdings: Record<string, Holding>;
  orders: Order[];
  watchlist: string[];
  toggleWatchlist: (symbol: string) => void;
  // Custom Watchlist Groups
  watchlistGroups: WatchlistGroup[];
  activeWatchlistGroupId: string;
  stockNotes: Record<string, string>;
  updateStockNote: (symbol: string, note: string) => void;
  setActiveWatchlistGroupId: (id: string) => void;
  createWatchlistGroup: (name: string, symbols?: string[]) => void;
  deleteWatchlistGroup: (id: string) => void;
  addStockToGroup: (groupId: string, symbol: string) => void;
  removeStockFromGroup: (groupId: string, symbol: string) => void;
  // Order execution
  executeBuyOrder: (
    symbol: string, 
    quantity: number, 
    orderType: 'MARKET' | 'LIMIT' | 'GTT', 
    limitPrice?: number,
    productType?: ProductType,
    bracketOrder?: BracketOrderParams,
    gttTriggerPrice?: number
  ) => { success: boolean; message: string };
  executeSellOrder: (
    symbol: string, 
    quantity: number, 
    orderType: 'MARKET' | 'LIMIT' | 'GTT', 
    limitPrice?: number,
    productType?: ProductType,
    bracketOrder?: BracketOrderParams,
    gttTriggerPrice?: number
  ) => { success: boolean; message: string };
  cancelPendingOrder: (orderId: string) => void;
  // Option Trading Simulator
  optionPositions: OptionPosition[];
  executeOptionOrder: (
    underlying: 'NIFTY' | 'BANKNIFTY',
    optionType: 'CE' | 'PE',
    strikePrice: number,
    expiryDate: string,
    contracts: number,
    price: number,
    action: 'BUY' | 'SELL'
  ) => { success: boolean; message: string };
  closeOptionPosition: (positionId: string) => { success: boolean; message: string };
  // Copilot feedback
  copilotFeedback: CopilotFeedback | null;
  clearCopilotFeedback: () => void;
  // Themes
  themeMode: 'light' | 'dark' | 'oled';
  setThemeMode: (mode: 'light' | 'dark' | 'oled') => void;
  // Metrics & State
  resetSimulator: () => void;
  portfolioValue: number;
  investedValue: number;
  totalPnL: number;
  totalPnLPercent: number;
  dayPnL: number;
  portfolioHistory: PortfolioSnapshot[];
  badges: Badge[];
  userXP: number;
  userLevel: { level: number; title: string; minXP: number; maxXP: number; nextLevelXp: number };
  completedLessonIds: string[];
  completeLesson: (lessonId: string, xpEarned: number) => void;
  earnXP: (amount: number, reason?: string) => void;
  marketIndices: MarketIndices | null;
  marketNews: MarketNews[];
  marketStatus: string;
  isMarketLive: boolean;
  nseMarketInfo: NSEMarketInfo;
  marketHoursMode: 'STRICT_NSE_HOURS' | 'PRACTICE_24x7';
  setMarketHoursMode: (mode: 'STRICT_NSE_HOURS' | 'PRACTICE_24x7') => void;
  notifyUser: (title: string, message: string, type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ALERT', symbol?: string) => void;
  refreshStocks: () => Promise<void>;
  syncHoldingsRealTime: () => Promise<void>;
  isSyncingHoldings: boolean;
  lastHoldingsSyncTime: string;
  unlockBadge: (badgeId: string) => void;
  broadcastAnnouncement: BroadcastAnnouncement | null;
  dismissBroadcast: () => void;
}


const SimulatorContext = createContext<SimulatorContextType | undefined>(undefined);

const INITIAL_CASH = 1000000; // ₹10,00,000

const getProfileStorageKey = (base: string, userId?: string | null) => `${base}:${userId || 'guest'}`;

const createFreshPortfolioHistory = (): PortfolioSnapshot[] => [{
  timestamp: new Date().toISOString(),
  timeLabel: 'Account opened',
  portfolioValue: INITIAL_CASH,
  investedValue: 0,
  cashBalance: INITIAL_CASH,
  totalPnL: 0,
}];

const createFreshBadges = (): Badge[] => INITIAL_BADGES.map((badge) => ({ ...badge }));

const DEFAULT_WATCHLIST_GROUPS: WatchlistGroup[] = [
  {
    id: 'grp-main',
    name: 'Core Watchlist',
    symbols: [],
    isCustom: false
  },
  {
    id: 'grp-ev',
    name: '⚡ EV & Mobility',
    symbols: ['TATAMOTORS', 'MARUTI', 'M&M', 'BAJAJ-AUTO', 'OLAELEC', 'EXIDEIND'],
    isCustom: true
  },
  {
    id: 'grp-tech',
    name: '🚀 High Growth Internet',
    symbols: ['ZOMATO', 'SWIGGY', 'NYKAA', 'POLICYBZR', 'NAUKRI', 'TCS'],
    isCustom: true
  },
  {
    id: 'grp-psu',
    name: '🏛️ High Dividend PSUs',
    symbols: ['COALINDIA', 'NTPC', 'ONGC', 'IOC', 'PFC', 'REC', 'BEL', 'HAL'],
    isCustom: true
  }
];

export const SimulatorProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Theme state
  const [themeMode, setThemeModeState] = useState<'light' | 'dark' | 'oled'>(() => {
    const saved = localStorage.getItem('rr_theme_mode');
    return (saved === 'dark' || saved === 'oled') ? saved : 'light';
  });

  const setThemeMode = (mode: 'light' | 'dark' | 'oled') => {
    setThemeModeState(mode);
    localStorage.setItem('rr_theme_mode', mode);
  };

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('theme-dark', 'theme-oled', 'dark');
    if (themeMode === 'dark') {
      root.classList.add('dark', 'theme-dark');
    } else if (themeMode === 'oled') {
      root.classList.add('dark', 'theme-oled');
    }
  }, [themeMode]);

  // Stocks initialized with technicals and DuPont enriched data
  const [stocks, setStocks] = useState<StockDetail[]>(() => {
    try {
      localStorage.removeItem('rr_live_quotes');
    } catch {}
    return TOP_100_INDIAN_COMPANIES.map(s => enrichStockWithTechnicalsAndDuPont(s));
  });
  
  const [selectedStock, setSelectedStock] = useState<StockDetail | null>(null);
  const [marketStatus, setMarketStatus] = useState<string>('NSE LIVE SIMULATOR');
  const [marketIndices, setMarketIndices] = useState<MarketIndices>(() => 
    computeMarketIndicesFromStocks(TOP_100_INDIAN_COMPANIES)
  );
  const [marketNews, setMarketNews] = useState<MarketNews[]>([]);

  // NSE Real-Time Market Timing State (Strict Mon-Fri 09:15 AM - 03:30 PM IST)
  const [nseMarketInfo, setNseMarketInfo] = useState<NSEMarketInfo>(() => getNSEMarketTimeInfo());
  const [marketHoursMode, setMarketHoursMode] = useState<'STRICT_NSE_HOURS' | 'PRACTICE_24x7'>(() => {
    const saved = localStorage.getItem('rr_market_hours_mode');
    return saved === 'PRACTICE_24x7' ? 'PRACTICE_24x7' : 'STRICT_NSE_HOURS';
  });

  useEffect(() => {
    localStorage.setItem('rr_market_hours_mode', marketHoursMode);
  }, [marketHoursMode]);

  useEffect(() => {
    const timer = setInterval(() => {
      setNseMarketInfo(getNSEMarketTimeInfo());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // User Authentication State
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(readActiveUser);

  useEffect(() => {
    if (!currentUser) return;

    const activityKey = getLastActivityKey(currentUser.id);
    let lastWrite = Number(localStorage.getItem(activityKey)) || Date.now();
    let sessionExpired = false;

    const expireInactiveSession = () => {
      if (sessionExpired) return;
      sessionExpired = true;
      localStorage.removeItem('rr_current_user');
      localStorage.removeItem(activityKey);
      localStorage.setItem('rr_logout_reason', 'inactive');
      window.location.reload();
    };

    const verifyAndRecordActivity = () => {
      const now = Date.now();
      const storedActivity = Number(localStorage.getItem(activityKey)) || lastWrite;
      if (now - storedActivity > INACTIVITY_TIMEOUT_MS) {
        expireInactiveSession();
        return;
      }
      if (now - lastWrite >= 60_000) {
        lastWrite = now;
        localStorage.setItem(activityKey, now.toString());
      }
    };

    const verifySession = () => {
      const storedActivity = Number(localStorage.getItem(activityKey)) || lastWrite;
      if (Date.now() - storedActivity > INACTIVITY_TIMEOUT_MS) expireInactiveSession();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') verifyAndRecordActivity();
    };

    const activityEvents: Array<keyof WindowEventMap> = ['pointerdown', 'keydown', 'scroll', 'touchstart'];
    activityEvents.forEach((eventName) => window.addEventListener(eventName, verifyAndRecordActivity, { passive: true }));
    document.addEventListener('visibilitychange', handleVisibilityChange);
    const expiryTimer = window.setInterval(verifySession, 60_000);

    return () => {
      activityEvents.forEach((eventName) => window.removeEventListener(eventName, verifyAndRecordActivity));
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.clearInterval(expiryTimer);
    };
  }, [currentUser]);

  const loginUser = async (identifier: string, password: string): Promise<{ success: boolean; message: string; user?: UserAccount }> => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password }),
      });
      if (res.ok) {
        const contentType = res.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          const data = await res.json();
          if (data.success && data.user) {
            data.user.isAdmin = isUserAdmin(data.user);
            data.user.role = data.user.isAdmin ? 'ADMIN' : 'USER';
            localStorage.setItem('rr_current_user', JSON.stringify(data.user));
            localStorage.setItem(getLastActivityKey(data.user.id), Date.now().toString());
            localStorage.setItem('rr_auth_entry', JSON.stringify({ kind: 'returning', userId: data.user.id, at: Date.now() }));
            setCurrentUser(data.user);
            return { success: true, message: data.message, user: data.user };
          }
          return { success: false, message: data.message || 'Login failed' };
        }
      }
    } catch {
      // Backend not running or offline (e.g. static site deployment on Hostinger / Netlify / Vercel)
    }

    // Static / Offline Login Fallback:
    const cleanId = identifier.trim().toLowerCase();
    const isDemoAccount =
      cleanId === 'xyz@gmail.com' ||
      cleanId === 'rookie_trader' ||
      cleanId === 'aaravvjain23@gmail.com';

    if (isDemoAccount && (password === 'RookiePass@2026' || password.length > 0)) {
      const demoAccountUser: UserAccount = {
        id: 'usr_rookie_demo',
        fullName: 'Aarav Jain',
        email: cleanId === 'xyz@gmail.com' ? 'xyz@gmail.com' : 'aaravvjain23@gmail.com',
        username: 'rookie_trader',
        phone: '+91 98765 43210',
        ageGroup: '16-18 (High School Teen)',
        experienceLevel: 'BEGINNER',
        initialCapital: INITIAL_CASH,
        registeredAt: '2026-03-01T09:15:00.000Z',
        lastLoginAt: new Date().toISOString(),
        portfolioValue: 1022789,
        totalTrades: 14,
        isAdmin: true,
        role: 'ADMIN',
      };
      localStorage.setItem('rr_current_user', JSON.stringify(demoAccountUser));
      localStorage.setItem(getLastActivityKey(demoAccountUser.id), Date.now().toString());
      localStorage.setItem('rr_auth_entry', JSON.stringify({ kind: 'returning', userId: demoAccountUser.id, at: Date.now() }));
      setCurrentUser(demoAccountUser);
      return { success: true, message: 'Welcome back, Aarav Jain!', user: demoAccountUser };
    }

    // Check local registry
    try {
      const localRegistryStr = localStorage.getItem('rr_local_users');
      if (localRegistryStr) {
        const localRegistry: UserAccount[] = JSON.parse(localRegistryStr);
        const match = localRegistry.find(
          (u) => u.email.toLowerCase() === cleanId || u.username.toLowerCase() === cleanId
        );
        if (match) {
          match.lastLoginAt = new Date().toISOString();
          match.isAdmin = isUserAdmin(match);
          match.role = match.isAdmin ? 'ADMIN' : 'USER';
          localStorage.setItem('rr_current_user', JSON.stringify(match));
          localStorage.setItem(getLastActivityKey(match.id), Date.now().toString());
          localStorage.setItem('rr_auth_entry', JSON.stringify({ kind: 'returning', userId: match.id, at: Date.now() }));
          setCurrentUser(match);
          return { success: true, message: `Welcome back, ${match.fullName}!`, user: match };
        }
      }
    } catch {}

    return { success: false, message: 'Invalid credentials. Please try again.' };
  };


  const registerUser = async (formData: AuthFormData): Promise<{ success: boolean; message: string; user?: UserAccount }> => {
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          initialCapital: INITIAL_CASH,
        }),
      });
      if (res.ok) {
        const contentType = res.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          const data = await res.json();
          if (data.success && data.user) {
            data.user.isAdmin = isUserAdmin(data.user);
            data.user.role = data.user.isAdmin ? 'ADMIN' : 'USER';
            localStorage.setItem('rr_current_user', JSON.stringify(data.user));
            localStorage.setItem(getLastActivityKey(data.user.id), Date.now().toString());
            localStorage.setItem('rr_auth_entry', JSON.stringify({ kind: 'new', userId: data.user.id, at: Date.now() }));
            setCurrentUser(data.user);
            return { success: true, message: data.message, user: data.user };
          }
          return { success: false, message: data.message || 'Registration failed' };
        }
      }
    } catch {
      // Backend not running or static host
    }

    // Static / Offline Registration Fallback:
    try {
      const newUser: UserAccount = {
        id: `usr_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        fullName: formData.fullName.trim(),
        email: formData.email.trim().toLowerCase(),
        username: formData.username.trim().toLowerCase(),
        phone: formData.phone?.trim() || '',
        ageGroup: formData.ageGroup || '16-18 (High School Teen)',
        experienceLevel: formData.experienceLevel || 'BEGINNER',
        initialCapital: INITIAL_CASH,
        registeredAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
        portfolioValue: INITIAL_CASH,
        totalTrades: 0,
        isAdmin: isUserAdmin({ email: formData.email, username: formData.username }),
        role: isUserAdmin({ email: formData.email, username: formData.username }) ? 'ADMIN' : 'USER',
      };

      const localRegistryStr = localStorage.getItem('rr_local_users');
      let localRegistry: UserAccount[] = [];
      try {
        if (localRegistryStr) localRegistry = JSON.parse(localRegistryStr);
      } catch {}

      localRegistry.unshift(newUser);
      localStorage.setItem('rr_local_users', JSON.stringify(localRegistry));
      localStorage.setItem('rr_current_user', JSON.stringify(newUser));
      localStorage.setItem(getLastActivityKey(newUser.id), Date.now().toString());
      localStorage.setItem('rr_auth_entry', JSON.stringify({ kind: 'new', userId: newUser.id, at: Date.now() }));
      setCurrentUser(newUser);

      return { success: true, message: 'Account created successfully!', user: newUser };
    } catch {
      return { success: false, message: 'Registration failed. Please try again.' };
    }
  };

  const loginWithGoogle = async (credential: string): Promise<{ success: boolean; message: string; user?: UserAccount; isNew?: boolean }> => {
    // 1. First attempt backend validation if available
    try {
      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential }),
      });
      if (res.ok) {
        const contentType = res.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          const data = await res.json();
          if (data.success && data.user) {
            data.user.isAdmin = isUserAdmin(data.user);
            data.user.role = data.user.isAdmin ? 'ADMIN' : 'USER';
            localStorage.setItem('rr_current_user', JSON.stringify(data.user));
            localStorage.setItem(getLastActivityKey(data.user.id), Date.now().toString());
            localStorage.setItem('rr_auth_entry', JSON.stringify({ kind: data.isNew ? 'new' : 'returning', userId: data.user.id, at: Date.now() }));
            setCurrentUser(data.user);
            return { success: true, message: data.message, user: data.user, isNew: Boolean(data.isNew) };
          }
        }
      }
    } catch {
      // Backend not running (e.g. static site deployment on Hostinger / Netlify / Vercel)
    }

    // 2. Resilient Client-Side ID Token (JWT) parsing for static hosting
    try {
      const parts = credential.split('.');
      if (parts.length === 3) {
        const base64Url = parts[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(
          atob(base64)
            .split('')
            .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
            .join('')
        );
        const payload = JSON.parse(jsonPayload);

        if (payload && (payload.email || payload.sub)) {
          const email = String(payload.email || `${payload.sub}@gmail.com`).toLowerCase();
          const fullName = String(payload.name || email.split('@')[0] || 'Investor');
          const usernameBase = (email.split('@')[0].toLowerCase().replace(/[^a-z0-9_]/g, '_').slice(0, 24) || 'rookie').padEnd(3, '_');

          // Check if user already exists in local accounts registry
          const localRegistryStr = localStorage.getItem('rr_local_users');
          let localRegistry: UserAccount[] = [];
          try {
            if (localRegistryStr) localRegistry = JSON.parse(localRegistryStr);
          } catch {}

          let matchedUser = localRegistry.find((u) => u.email.toLowerCase() === email);
          const isNew = !matchedUser;

          if (!matchedUser) {
            matchedUser = {
              id: `usr_g_${payload.sub ? String(payload.sub).slice(-8) : Date.now().toString().slice(-8)}`,
              fullName,
              email,
              username: usernameBase,
              phone: '',
              ageGroup: '16-18 (High School Teen)',
              experienceLevel: 'BEGINNER',
              initialCapital: INITIAL_CASH,
              registeredAt: new Date().toISOString(),
              lastLoginAt: new Date().toISOString(),
              portfolioValue: INITIAL_CASH,
              totalTrades: 0,
              isAdmin: isUserAdmin({ email, username: usernameBase }),
              role: isUserAdmin({ email, username: usernameBase }) ? 'ADMIN' : 'USER',
            };
            localRegistry.unshift(matchedUser);
            localStorage.setItem('rr_local_users', JSON.stringify(localRegistry));
          } else {
            matchedUser.lastLoginAt = new Date().toISOString();
            matchedUser.isAdmin = isUserAdmin(matchedUser);
            matchedUser.role = matchedUser.isAdmin ? 'ADMIN' : 'USER';
          }

          localStorage.setItem('rr_current_user', JSON.stringify(matchedUser));
          localStorage.setItem(getLastActivityKey(matchedUser.id), Date.now().toString());
          localStorage.setItem('rr_auth_entry', JSON.stringify({ kind: isNew ? 'new' : 'returning', userId: matchedUser.id, at: Date.now() }));
          setCurrentUser(matchedUser);

          return {
            success: true,
            message: isNew ? 'Account created with Google!' : `Welcome back, ${matchedUser.fullName}!`,
            user: matchedUser,
            isNew,
          };
        }
      }
    } catch (parseErr) {
      console.error('Failed to parse Google credential on client:', parseErr);
    }


    return { success: false, message: 'Google sign-in could not complete. Please try again.' };
  };

  const logoutUser = () => {
    if (currentUser) localStorage.removeItem(getLastActivityKey(currentUser.id));
    localStorage.removeItem('rr_current_user');
    window.location.reload();
  };

  const profileStorageKey = (base: string) => getProfileStorageKey(base, currentUser?.id);

  // Persistent user trading state
  const [cashBalance, setCashBalance] = useState<number>(() => {
    const saved = localStorage.getItem(getProfileStorageKey('rr_cash', currentUser?.id));
    return saved !== null ? Number(saved) : INITIAL_CASH;
  });

  const [holdings, setHoldings] = useState<Record<string, Holding>>(() => {
    const saved = localStorage.getItem(getProfileStorageKey('rr_holdings', currentUser?.id));
    return saved ? JSON.parse(saved) : {};
  });

  const [orders, setOrders] = useState<Order[]>(() => {
    const saved = localStorage.getItem(getProfileStorageKey('rr_orders', currentUser?.id));
    return saved ? JSON.parse(saved) : [];
  });

  // Watchlist Groups
  
  const [stockNotes, setStockNotes] = useState<Record<string, string>>(() => {
    const saved = localStorage.getItem(getProfileStorageKey('rr_notes', currentUser?.id));
    return saved ? JSON.parse(saved) : {};
  });

  const updateStockNote = (symbol: string, note: string) => {
    setStockNotes(prev => ({ ...prev, [symbol]: note }));
  };

  useEffect(() => {
    localStorage.setItem(profileStorageKey('rr_notes'), JSON.stringify(stockNotes));
  }, [stockNotes, currentUser]);

  const [watchlistGroups, setWatchlistGroups] = useState<WatchlistGroup[]>(() => {
    const saved = localStorage.getItem(getProfileStorageKey('rr_watchlist_groups', currentUser?.id));
    return saved ? JSON.parse(saved) : DEFAULT_WATCHLIST_GROUPS;
  });

  const [activeWatchlistGroupId, setActiveWatchlistGroupId] = useState<string>('grp-main');

  const activeWatchlistGroup = useMemo(() => {
    return watchlistGroups.find(g => g.id === activeWatchlistGroupId) || watchlistGroups[0];
  }, [watchlistGroups, activeWatchlistGroupId]);

  const watchlist = activeWatchlistGroup?.symbols || [];

  const toggleWatchlist = (symbol: string) => {
    setWatchlistGroups(prev => prev.map(group => {
      if (group.id === activeWatchlistGroupId) {
        const exists = group.symbols.includes(symbol);
        const updated = exists ? group.symbols.filter(s => s !== symbol) : [...group.symbols, symbol];
        return { ...group, symbols: updated };
      }
      return group;
    }));
  };

  const createWatchlistGroup = (name: string, symbols: string[] = []) => {
    const newGroup: WatchlistGroup = {
      id: `grp-${Date.now()}`,
      name,
      symbols,
      isCustom: true,
      createdAt: new Date().toISOString()
    };
    setWatchlistGroups(prev => [...prev, newGroup]);
    setActiveWatchlistGroupId(newGroup.id);
  };

  const deleteWatchlistGroup = (id: string) => {
    setWatchlistGroups(prev => prev.filter(g => g.id !== id));
    if (activeWatchlistGroupId === id) {
      setActiveWatchlistGroupId('grp-main');
    }
  };

  const addStockToGroup = (groupId: string, symbol: string) => {
    setWatchlistGroups(prev => prev.map(g => {
      if (g.id === groupId && !g.symbols.includes(symbol)) {
        return { ...g, symbols: [...g.symbols, symbol] };
      }
      return g;
    }));
  };

  const removeStockFromGroup = (groupId: string, symbol: string) => {
    setWatchlistGroups(prev => prev.map(g => {
      if (g.id === groupId) {
        return { ...g, symbols: g.symbols.filter(s => s !== symbol) };
      }
      return g;
    }));
  };

  // Option positions
  const [optionPositions, setOptionPositions] = useState<OptionPosition[]>(() => {
    const saved = localStorage.getItem(getProfileStorageKey('rr_option_positions', currentUser?.id));
    return saved ? JSON.parse(saved) : [];
  });

  // Copilot feedback
  const [copilotFeedback, setCopilotFeedback] = useState<CopilotFeedback | null>(null);
  const clearCopilotFeedback = () => setCopilotFeedback(null);

  const [portfolioHistory, setPortfolioHistory] = useState<PortfolioSnapshot[]>(() => {
    const saved = localStorage.getItem(getProfileStorageKey('rr_history', currentUser?.id));
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch {
        // Start with a clean, truthful baseline when stored history is invalid.
      }
    }
    return createFreshPortfolioHistory();
  });

  const [badges, setBadges] = useState<Badge[]>(() => {
    const saved = localStorage.getItem(getProfileStorageKey('rr_badges', currentUser?.id));
    return saved ? JSON.parse(saved) : createFreshBadges();
  });

  const [completedLessonIds, setCompletedLessonIds] = useState<string[]>(() => {
    const saved = localStorage.getItem(getProfileStorageKey('rr_lessons', currentUser?.id));
    return saved ? JSON.parse(saved) : [];
  });

  const [userXP, setUserXP] = useState<number>(() => {
    const saved = localStorage.getItem(getProfileStorageKey('rr_xp', currentUser?.id));
    return saved !== null ? Number(saved) : 0;
  });

  const [xpLedger, setXpLedger] = useState<Record<string, number>>(() => {
    const saved = localStorage.getItem(getProfileStorageKey('rr_xp_ledger', currentUser?.id));
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // Fall back to an empty activity ledger.
      }
    }
    return {};
  });

  const [alerts, setAlerts] = useState<Alert[]>(() => {
    const saved = localStorage.getItem(getProfileStorageKey('rr_alerts', currentUser?.id));
    return saved ? JSON.parse(saved) : [];
  });
  
  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    const saved = localStorage.getItem(getProfileStorageKey('rr_notifications', currentUser?.id));
    return saved ? JSON.parse(saved) : [];
  });

  const [dailyPercentTriggers, setDailyPercentTriggers] = useState<Record<string, string>>({});
  
  const [broadcastAnnouncement, setBroadcastAnnouncement] = useState<BroadcastAnnouncement | null>(null);

  const dismissBroadcast = useCallback(() => {
    if (broadcastAnnouncement) {
      sessionStorage.setItem(`rr_dismissed_broadcast_${broadcastAnnouncement.id}`, 'true');
    }
    setBroadcastAnnouncement(null);
  }, [broadcastAnnouncement]);

  useEffect(() => {
    let channel: BroadcastChannel | null = null;
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        channel = new BroadcastChannel('rr_broadcast_channel');
        channel.onmessage = (event) => {
          if (event.data && event.data.broadcast) {
            const b = event.data.broadcast as BroadcastAnnouncement;
            if (b && !sessionStorage.getItem(`rr_dismissed_broadcast_${b.id}`)) {
              setBroadcastAnnouncement(b);
            }
          }
        };
      } catch {}
    }

    const fetchBroadcast = async () => {
      try {
        const res = await fetch('/api/broadcast');
        if (res.ok) {
          const data = await res.json();
          if (data.broadcast && !sessionStorage.getItem(`rr_dismissed_broadcast_${data.broadcast.id}`)) {
            setBroadcastAnnouncement(data.broadcast);
          }
        }
      } catch {}
    };

    fetchBroadcast();
    const interval = setInterval(fetchBroadcast, 15000);

    return () => {
      if (channel) channel.close();
      clearInterval(interval);
    };
  }, []);
  
  useEffect(() => {
    localStorage.setItem(profileStorageKey('rr_alerts'), JSON.stringify(alerts));
  }, [alerts]);
  
  useEffect(() => {
    localStorage.setItem(profileStorageKey('rr_notifications'), JSON.stringify(notifications));
  }, [notifications]);

  useEffect(() => {
    localStorage.setItem(profileStorageKey('rr_cash'), cashBalance.toString());
  }, [cashBalance]);

  useEffect(() => {
    localStorage.setItem(profileStorageKey('rr_holdings'), JSON.stringify(holdings));
  }, [holdings]);

  useEffect(() => {
    localStorage.setItem(profileStorageKey('rr_orders'), JSON.stringify(orders));
  }, [orders]);

  useEffect(() => {
    localStorage.setItem(profileStorageKey('rr_watchlist_groups'), JSON.stringify(watchlistGroups));
  }, [watchlistGroups]);

  useEffect(() => {
    localStorage.setItem(profileStorageKey('rr_option_positions'), JSON.stringify(optionPositions));
  }, [optionPositions]);

  useEffect(() => {
    localStorage.setItem(profileStorageKey('rr_history'), JSON.stringify(portfolioHistory));
  }, [portfolioHistory]);

  useEffect(() => {
    localStorage.setItem(profileStorageKey('rr_badges'), JSON.stringify(badges));
  }, [badges]);

  useEffect(() => {
    localStorage.setItem(profileStorageKey('rr_lessons'), JSON.stringify(completedLessonIds));
  }, [completedLessonIds]);

  useEffect(() => {
    localStorage.setItem(profileStorageKey('rr_xp'), userXP.toString());
  }, [userXP]);

  useEffect(() => {
    localStorage.setItem(profileStorageKey('rr_xp_ledger'), JSON.stringify(xpLedger));
  }, [xpLedger]);

  // Real-time synchronization state for purchased shares
  const [isSyncingHoldings, setIsSyncingHoldings] = useState(false);
  const [lastHoldingsSyncTime, setLastHoldingsSyncTime] = useState<string>(() => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));

  // Stable references to prevent circular dependency triggers in timers and callbacks
  const stocksRef = useRef(stocks);
  stocksRef.current = stocks;

  const holdingsRef = useRef(holdings);
  holdingsRef.current = holdings;

  // Dedicated real-time sync for all stocks owned in user holdings
  const syncHoldingsRealTime = useCallback(async () => {
    const holdingSymbols = Object.keys(holdingsRef.current);
    if (holdingSymbols.length === 0) return;

    setIsSyncingHoldings(true);
    try {
      const res = await fetch('/api/stocks/sync-holdings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbols: holdingSymbols })
      });
      if (res.ok) {
        const contentType = res.headers.get('content-type') || '';
        if (!contentType.includes('application/json')) return;

        const data = await res.json();
        if (data && data.updatedStocks && Array.isArray(data.updatedStocks) && data.updatedStocks.length > 0) {
          setStocks(prev => {
            const apiMap = new Map<string, StockDetail>();
            data.updatedStocks.forEach((s: StockDetail) => {
              if (s && s.symbol) apiMap.set(s.symbol, enrichStockWithTechnicalsAndDuPont(s));
            });
            
            // Evaluate local storage alerts
            if (data.stocks && Array.isArray(data.stocks)) {
              try {
                const storageKey = `rr_watchlist_workspace:${currentUser?.id || 'guest'}:alerts`;
                const localAlerts = JSON.parse(localStorage.getItem(storageKey) || '{}');
                let changed = false;
                
                for (const symbol of Object.keys(localAlerts)) {
                   const targetPrice = localAlerts[symbol];
                   if (!targetPrice) continue;
                   
                   const stock = data.stocks.find((s: any) => s.symbol === symbol);
                   if (stock) {
                      const price = stock.price;
                      const prevPrice = stock.open || (stock.price - stock.change);
                      
                      const crossedUp = prevPrice < targetPrice && price >= targetPrice;
                      const crossedDown = prevPrice > targetPrice && price <= targetPrice;
                      const isNear = Math.abs(price - targetPrice) / targetPrice < 0.005;
                      
                      if (crossedUp || crossedDown || isNear) {
                          if (Notification.permission === "granted") {
                             new Notification("Price Alert Triggered!", {
                               body: `${symbol} is now ${price} (Target: ${targetPrice})`,
                               icon: '/favicon.ico'
                             });
                          }
                          delete localAlerts[symbol];
                          changed = true;
                      }
                   }
                }
                
                if (changed) {
                   localStorage.setItem(storageKey, JSON.stringify(localAlerts));
                   window.dispatchEvent(new Event('rr_alerts_updated'));
                }
              } catch (e) {}
            }
            
            const updated = prev.map(stock => {
              const apiItem = apiMap.get(stock.symbol);
              return apiItem ? mergeQuote(stock, apiItem) : stock;
            });
            const existingSymbols = new Set(prev.map(s => s.symbol));
            data.updatedStocks.forEach((s: StockDetail) => {
              if (s && s.symbol && !existingSymbols.has(s.symbol)) {
                updated.push(enrichStockWithTechnicalsAndDuPont(s));
              }
            });
            return updated;
          });
          setLastHoldingsSyncTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
        }
      }
    } catch {
      // safe fallback
    } finally {
      setIsSyncingHoldings(false);
    }
  }, []);

  // Fetch stocks from backend and enrich, with resilient real-time micro-tick fallback for static hosting
  const fetchStocks = useCallback(async () => {
    try {
      const res = await fetch('/api/stocks');
      if (res.ok) {
        const contentType = res.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          const data = await res.json();
          if (data && data.stocks && Array.isArray(data.stocks) && data.stocks.length > 0) {
            if (typeof window !== 'undefined') {
              window.dispatchEvent(new CustomEvent('rr_stocks_updated', { detail: { stocks: data.stocks } }));
              try {
                const bc = new BroadcastChannel('rr_stocks_channel');
                bc.postMessage({ type: 'STOCKS_UPDATED', stocks: data.stocks });
                bc.close();
              } catch {}
            }
            setStocks(prev => {
              const apiMap = new Map<string, StockDetail>();
              data.stocks.forEach((s: StockDetail) => {
                if (s && s.symbol) apiMap.set(s.symbol, enrichStockWithTechnicalsAndDuPont(s));
              });
              const updated = prev.map(stock => {
                const apiItem = apiMap.get(stock.symbol);
                return apiItem ? mergeQuote(stock, apiItem) : stock;
              });
              const existingSymbols = new Set(prev.map(s => s.symbol));
              data.stocks.forEach((s: StockDetail) => {
                if (s && s.symbol && !existingSymbols.has(s.symbol)) {
                  updated.push(enrichStockWithTechnicalsAndDuPont(s));
                }
              });
              return updated;
            });
            if (data.marketStatus) setMarketStatus(data.marketStatus);
            return;
          }
        }
      }
    } catch {
      // Backend not running or static host deployment
    }
  }, []);

  const fetchMarketSummary = useCallback(async () => {
    try {
      const res = await fetch('/api/market/summary');
      if (res.ok) {
        const contentType = res.headers.get('content-type') || '';
        if (!contentType.includes('application/json')) return;

        const data = await res.json();
        if (data) {
          if (data.indices) {
            setMarketIndices(computeMarketIndicesFromStocks(stocksRef.current, data.indices));
          }
          if (data.news) setMarketNews(data.news);
        }
      }
    } catch {
      // Offline fallback: dynamically compute indices from local stocks
      setMarketIndices(prev => computeMarketIndicesFromStocks(stocksRef.current, prev));
    }
  }, []);

  useEffect(() => {
    fetchStocks();
    syncHoldingsRealTime();
    fetchMarketSummary();

    const interval = setInterval(() => {
      fetchStocks();
      syncHoldingsRealTime();
    }, 4000);

    const newsInterval = setInterval(() => {
      fetchMarketSummary();
    }, 30000);

    return () => {
      clearInterval(interval);
      clearInterval(newsInterval);
    };
  }, [fetchStocks, syncHoldingsRealTime, fetchMarketSummary]);

  // Instant real-time listener for stock updates across components/tabs
  useEffect(() => {
    const stream = new EventSource('/api/market/stream');
    stream.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (Array.isArray(data.stocks) && data.stocks.length > 0) {
          window.dispatchEvent(new CustomEvent('rr_stocks_updated', { detail: { stocks: data.stocks } }));
        }
      } catch { /* Ignore incomplete stream messages; polling remains available. */ }
    };
    stream.onerror = () => {
      setStocks(previous => previous.map(stock => stock.quoteStatus === 'live'
        ? { ...stock, quoteStatus: 'delayed' } : stock));
    };
    const handleStockUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<{ stocks: StockDetail[] }>;
      if (customEvent.detail?.stocks && Array.isArray(customEvent.detail.stocks)) {
        setStocks(prev => {
          const apiMap = new Map<string, StockDetail>();
          customEvent.detail.stocks.forEach((s: StockDetail) => {
            if (s && s.symbol) apiMap.set(s.symbol, enrichStockWithTechnicalsAndDuPont(s));
          });
          return prev.map(stock => {
            const apiItem = apiMap.get(stock.symbol);
            return apiItem ? mergeQuote(stock, apiItem) : stock;
          });
        });
      }
    };

    window.addEventListener('rr_stocks_updated', handleStockUpdate);

    let bc: BroadcastChannel | null = null;
    try {
      bc = new BroadcastChannel('rr_stocks_channel');
      bc.onmessage = (event) => {
        if (event.data?.type === 'STOCKS_UPDATED' && Array.isArray(event.data.stocks)) {
          window.dispatchEvent(new CustomEvent('rr_stocks_updated', { detail: { stocks: event.data.stocks } }));
        }
      };
    } catch {}

    return () => {
      stream.close();
      window.removeEventListener('rr_stocks_updated', handleStockUpdate);
      bc?.close();
    };
  }, []);

  useEffect(() => {
    if (selectedStock) {
      const updated = stocks.find((s) => s.symbol === selectedStock.symbol);
      if (updated && updated !== selectedStock) {
        setSelectedStock(updated);
      }
    }
  }, [stocks, selectedStock]);

  const addAlert = (symbol: string, targetPrice: number, type: 'ABOVE' | 'BELOW') => {
    const newAlert: Alert = {
      id: `ALT-${Date.now()}`,
      symbol,
      targetPrice,
      type,
      active: true,
      createdAt: new Date().toISOString()
    };
    setAlerts(prev => [...prev, newAlert]);
  };

  const addSmartAlert = (alert: Omit<Alert, 'id' | 'active' | 'createdAt'>) => {
    setAlerts((previous) => [...previous, { ...alert, id: `ALT-${Date.now()}`, active: true, createdAt: new Date().toISOString() }]);
  };

  const removeAlert = (id: string) => {
    setAlerts(prev => prev.filter(a => a.id !== id));
  };

  const markNotificationRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };
  
  const markAllNotificationsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const notifyUser = useCallback((title: string, message: string, type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ALERT', symbol?: string) => {
    const newNotif: AppNotification = {
      id: `NOT-${Date.now()}-${Math.floor(Math.random()*1000)}`,
      title,
      message,
      type,
      timestamp: new Date().toISOString(),
      read: false,
      symbol
    };
    setNotifications(prev => [newNotif, ...prev].slice(0, 50));
  }, []);

  const awardXP = useCallback((eventId: string, amount: number, reason?: string) => {
    const safeAmount = Math.max(0, Math.round(amount));
    if (!eventId || safeAmount === 0) return;

    setXpLedger((previousLedger) => {
      if (previousLedger[eventId] !== undefined) return previousLedger;
      setUserXP((previousXP) => previousXP + safeAmount);
      if (reason) {
        notifyUser('XP earned', `+${safeAmount} XP · ${reason}`, 'SUCCESS');
      }
      return { ...previousLedger, [eventId]: safeAmount };
    });
  }, [notifyUser]);

  const unlockBadge = useCallback((badgeId: string) => {
    setBadges((prev) => {
      const found = prev.find((b) => b.id === badgeId);
      if (found && !found.unlocked) {
        awardXP(`badge:${badgeId}`, found.xpReward || 0, `Unlocked ${found.title}`);
        confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
        return prev.map((b) => (b.id === badgeId ? { ...b, unlocked: true, unlockedAt: new Date().toLocaleDateString('en-IN') } : b));
      }
      return prev;
    });
  }, [awardXP]);

  // Compute User Level
  const userLevel = useMemo(() => {
    if (userXP < 300) return { level: 1, title: 'Dalal Street Rookie 🌱', minXP: 0, maxXP: 300, nextLevelXp: 300 };
    if (userXP < 700) return { level: 2, title: 'Smart Stock Explorer 🔍', minXP: 300, maxXP: 700, nextLevelXp: 700 };
    if (userXP < 1300) return { level: 3, title: 'Portfolio Prodigy 💼', minXP: 700, maxXP: 1300, nextLevelXp: 1300 };
    if (userXP < 2000) return { level: 4, title: 'Market Strategist 📊', minXP: 1300, maxXP: 2000, nextLevelXp: 2000 };
    return { level: 5, title: 'Dalal Street Legend 👑', minXP: 2000, maxXP: 3500, nextLevelXp: 3500 };
  }, [userXP]);

  // Calculate Real-Time Portfolio Metrics including Option positions
  const { currentValueOfHoldings, investedValue, dayPnL } = useMemo(() => {
    let currentVal = 0;
    let invVal = 0;
    let dPnL = 0;

    (Object.values(holdings) as Holding[]).forEach((holding: Holding) => {
      const liveStock = stocks.find((s) => s.symbol === holding.symbol);
      const curPrice = liveStock ? liveStock.price : holding.avgBuyPrice;
      const dayChange = liveStock ? (typeof liveStock.change === 'number' && !isNaN(liveStock.change) ? liveStock.change : (liveStock.price - (liveStock.previousClose || liveStock.price))) : 0;

      const posVal = curPrice * holding.quantity;
      currentVal += posVal;
      invVal += holding.totalInvested;
      dPnL += dayChange * holding.quantity;
    });

    // Add options positions value
    optionPositions.forEach(opt => {
      currentVal += opt.currentValue;
      invVal += opt.investedAmount;
      dPnL += opt.pnl;
    });

    return {
      currentValueOfHoldings: currentVal,
      investedValue: invVal,
      dayPnL: dPnL,
    };
  }, [holdings, stocks, optionPositions]);

  const portfolioValue = cashBalance + currentValueOfHoldings;
  const totalPnL = portfolioValue - INITIAL_CASH;
  const totalPnLPercent = (totalPnL / INITIAL_CASH) * 100;

  useEffect(() => {
    const triggered: Alert[] = [];
    const today = new Date();
    const investedTotal = Object.values(holdings).reduce((sum, holding) => {
      const stock = stocks.find((item) => item.symbol === holding.symbol);
      return sum + holding.quantity * (stock?.price || holding.avgBuyPrice);
    }, 0);

    alerts.forEach((alert) => {
      if (!alert.active) return;
      const stock = stocks.find((item) => item.symbol === alert.symbol);
      let reached = false;
      if ((alert.kind === undefined || alert.kind === 'PRICE') && stock && alert.targetPrice) reached = alert.type === 'ABOVE' ? stock.price >= alert.targetPrice : stock.price <= alert.targetPrice;
      if (alert.kind === 'WEEK_52' && stock) reached = alert.type === 'ABOVE' ? stock.price >= stock.high52 : stock.price <= stock.low52;
      if (alert.kind === 'MOVE_PERCENT' && stock && alert.threshold) reached = Math.abs(stock.changePercent) >= alert.threshold;
      if (alert.kind === 'PE_CHANGE' && stock && alert.threshold && alert.baselineValue) reached = Math.abs(((stock.peRatio - alert.baselineValue) / alert.baselineValue) * 100) >= alert.threshold;
      if (alert.kind === 'EARNINGS' && alert.eventDate) { const days = (new Date(alert.eventDate).getTime() - today.getTime()) / 86400000; reached = days >= 0 && days <= 3; }
      if (alert.kind === 'SECTOR_CONCENTRATION' && alert.sector && alert.threshold && investedTotal > 0) {
        const sectorValue = Object.values(holdings).reduce((sum, holding) => { const item = stocks.find((candidate) => candidate.symbol === holding.symbol); return item?.sector === alert.sector ? sum + holding.quantity * item.price : sum; }, 0);
        reached = (sectorValue / investedTotal) * 100 >= alert.threshold;
      }
      if (alert.kind === 'DRAWDOWN' && alert.threshold) reached = totalPnLPercent <= -alert.threshold;
      if (reached) triggered.push(alert);
    });

    if (triggered.length) {
      const ids = new Set(triggered.map((alert) => alert.id));
      setAlerts((previous) => previous.map((alert) => ids.has(alert.id) ? { ...alert, active: false } : alert));
      triggered.forEach((alert) => notifyUser('Learning alert reached', `${alert.symbol}: ${alert.reason || 'Your planned review condition was reached.'}${alert.lessonTitle ? ` Related lesson: ${alert.lessonTitle}.` : ''}`, 'ALERT', alert.symbol));
    }
  }, [alerts, holdings, notifyUser, portfolioValue, stocks, totalPnLPercent]);

  useEffect(() => {
    const hasRecordedActivity = orders.some((order) => order.status === 'EXECUTED') || completedLessonIds.length > 0 || watchlist.length > 0;
    const nonStarterEvents = Object.keys(xpLedger).filter((eventId) => eventId !== 'badge:badge-rookie');
    if (hasRecordedActivity || nonStarterEvents.length > 0 || !xpLedger['badge:badge-rookie']) return;

    const legacyStarterXP = xpLedger['badge:badge-rookie'];
    setBadges((previous) => previous.map((badge) => badge.id === 'badge-rookie' ? { ...badge, unlocked: false, unlockedAt: undefined } : badge));
    setXpLedger((previous) => {
      const next = { ...previous };
      delete next['badge:badge-rookie'];
      return next;
    });
    setUserXP((previous) => Math.max(0, previous - legacyStarterXP));
  }, [completedLessonIds.length, orders, watchlist.length, xpLedger]);

  useEffect(() => {
    const executedOrders = orders.filter((order) => order.status === 'EXECUTED');
    const heldSectors = new Set(
      Object.keys(holdings)
        .map((symbol) => stocks.find((stock) => stock.symbol === symbol)?.sector)
        .filter((sector): sector is string => Boolean(sector))
    );

    if (executedOrders.some((order) => order.type === 'BUY')) unlockBadge('badge-first-trade');
    if (executedOrders.length > 0 || completedLessonIds.length > 0 || watchlist.length > 0) unlockBadge('badge-rookie');
    if (executedOrders.length >= 10) unlockBadge('badge-10-trades');
    if (heldSectors.size >= 4) unlockBadge('badge-diversified');
    if (totalPnL >= 10000) unlockBadge('badge-10k-profit');
    if (watchlist.length >= 5) unlockBadge('badge-watchlister');
  }, [completedLessonIds.length, holdings, orders, stocks, totalPnL, unlockBadge, watchlist.length]);

  // Record periodic snapshot
  useEffect(() => {
    if (portfolioValue > 0) {
      const now = new Date();
      const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      setPortfolioHistory((prev) => {
        const last = prev[prev.length - 1];
        if (last && Math.abs(last.portfolioValue - portfolioValue) < 10) return prev;
        const newSnap: PortfolioSnapshot = {
          timestamp: now.toISOString(),
          timeLabel: timeStr,
          portfolioValue: Number(portfolioValue.toFixed(2)),
          investedValue: Number(investedValue.toFixed(2)),
          cashBalance: Number(cashBalance.toFixed(2)),
          totalPnL: Number(totalPnL.toFixed(2)),
        };
        const updated = [...prev, newSnap];
        return updated.slice(-25);
      });
    }
  }, [portfolioValue, investedValue, cashBalance, totalPnL]);

  // Execute Pending Orders (AMO / GTT / Limit)
  useEffect(() => {
    const isMarketOpen = marketHoursMode === 'PRACTICE_24x7' || nseMarketInfo.isNSEMarketOpen;
    if (!isMarketOpen) return;

    const pendingOrders = orders.filter(o => o.status === 'PENDING');
    if (pendingOrders.length === 0) return;

    let ordersChanged = false;
    let holdingsChanged = false;
    let cashChanged = false;

    const nextOrders = [...orders];
    const nextHoldings = { ...holdings };
    let nextCash = cashBalance;

    const notificationsToSend: { title: string, body: string, type: 'SUCCESS' | 'INFO' | 'WARNING' | 'ALERT', symbol?: string }[] = [];

    pendingOrders.forEach(pendingOrder => {
      const orderIndex = nextOrders.findIndex(o => o.id === pendingOrder.id);
      if (orderIndex === -1) return;
      const order = { ...nextOrders[orderIndex] };

      const stock = stocks.find(s => s.symbol === order.symbol);
      if (!stock) return;

      let shouldExecute = false;
      let execPrice = stock.price;

      if (order.isAMO) {
        shouldExecute = true;
        execPrice = stock.price;
      } else if (order.orderType === 'GTT' || order.orderType === 'LIMIT') {
        const target = order.gttTriggerPrice || order.price;
        if (order.gttCondition === 'ABOVE' && stock.price >= target) {
          shouldExecute = true;
          execPrice = target;
        } else if (order.gttCondition === 'BELOW' && stock.price <= target) {
          shouldExecute = true;
          execPrice = target;
        }
      }

      if (shouldExecute) {
        ordersChanged = true;
        order.status = 'EXECUTED';
        order.executionTime = nseMarketInfo.istTimeString;

        if (order.type === 'BUY') {
          const oldCost = order.totalAmount;
          const newCost = execPrice * order.quantity;
          const marginDiff = order.productType === 'MIS' ? (newCost - oldCost) / 5 : (newCost - oldCost);
          
          nextCash -= marginDiff;
          cashChanged = true;
          
          order.price = execPrice;
          order.totalAmount = newCost;
          order.marginUsed = order.productType === 'MIS' ? newCost / 5 : newCost;

          const existing = nextHoldings[order.symbol];
          if (existing) {
            const newQty = existing.quantity + order.quantity;
            const newTotalInvested = existing.totalInvested + newCost;
            nextHoldings[order.symbol] = {
              ...existing,
              quantity: newQty,
              totalInvested: newTotalInvested,
              avgBuyPrice: newTotalInvested / newQty,
            };
          } else {
            nextHoldings[order.symbol] = {
              symbol: order.symbol,
              quantity: order.quantity,
              avgBuyPrice: execPrice,
              totalInvested: newCost,
              productType: order.productType,
              buyDate: new Date().toISOString()
            };
          }
          holdingsChanged = true;
          
          notificationsToSend.push({
            title: 'Order Executed! 🚀',
            body: `Pending BUY order for ${order.quantity} shares of ${stock.name} executed at ₹${execPrice.toFixed(2)}.`,
            type: 'SUCCESS',
            symbol: order.symbol
          });

        } else if (order.type === 'SELL') {
          const existing = nextHoldings[order.symbol];
          if (!existing) {
            order.status = 'CANCELLED';
            order.notes = 'Cancelled: No holdings available to sell.';
            notificationsToSend.push({
              title: 'Order Cancelled',
              body: `Pending SELL order for ${order.symbol} cancelled: No holdings.`,
              type: 'ALERT'
            });
          } else {
            const costBasisOfSoldShares = existing.avgBuyPrice * order.quantity;
            const saleProceeds = execPrice * order.quantity;
            const realizedPnL = saleProceeds - costBasisOfSoldShares;
            
            const marginRefund = existing.productType === 'MIS' ? (costBasisOfSoldShares / 5) : costBasisOfSoldShares;
            const cashToAdd = marginRefund + realizedPnL;
            
            nextCash += cashToAdd;
            cashChanged = true;
            
            const newQty = existing.quantity - order.quantity;
            if (newQty <= 0) {
              delete nextHoldings[order.symbol];
            } else {
              nextHoldings[order.symbol] = {
                ...existing,
                quantity: newQty,
                totalInvested: existing.totalInvested - costBasisOfSoldShares
              };
            }
            holdingsChanged = true;
            
            order.price = execPrice;
            order.totalAmount = saleProceeds;
            order.realizedPnL = realizedPnL;
            order.exitReason = realizedPnL >= 0 ? 'TARGET_HIT' : 'STOP_LOSS_HIT';
            order.closedAt = new Date().toISOString();
            
            notificationsToSend.push({
              title: 'Order Executed! 💰',
              body: `Pending SELL order for ${order.quantity} shares of ${stock.name} executed at ₹${execPrice.toFixed(2)} (${realizedPnL >= 0 ? `+₹${realizedPnL.toFixed(2)} profit` : `-₹${Math.abs(realizedPnL).toFixed(2)} loss`}).`,
              type: 'SUCCESS',
              symbol: order.symbol
            });
          }
        }
        
        nextOrders[orderIndex] = order;
      }
    });

    if (ordersChanged) setOrders(nextOrders);
    if (holdingsChanged) setHoldings(nextHoldings);
    if (cashChanged) setCashBalance(Number(nextCash.toFixed(2)));
    
    notificationsToSend.forEach(n => setTimeout(() => notifyUser(n.title, n.body, n.type, n.symbol), 100));

  }, [stocks, marketHoursMode, nseMarketInfo.isNSEMarketOpen, orders, holdings, cashBalance]);

  // Real-time Trade Sync to Admin Dashboard (Cross-Tab BroadcastChannel + LocalStorage + Backend API)
  const syncTradeToAdminAndBroadcast = useCallback((tradePayload: {
    orderId?: string;
    symbol: string;
    stockName: string;
    type: 'BUY' | 'SELL';
    orderType: 'MARKET' | 'LIMIT' | 'GTT';
    productType: ProductType;
    quantity: number;
    price: number;
    totalAmount: number;
    realizedPnL?: number;
    status?: 'EXECUTED' | 'PENDING' | 'CANCELLED';
  }) => {
    try {
      const fullTrade = {
        ...tradePayload,
        userId: currentUser?.id || 'usr_rookie_demo',
        userName: currentUser?.fullName || 'Aarav Jain',
        userEmail: currentUser?.email || 'aaravvjain23@gmail.com',
        timestamp: new Date().toISOString()
      };

      // 1. BroadcastChannel for instant cross-tab sync to open Admin Dashboard
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        try {
          const channel = new BroadcastChannel('rr_trades_channel');
          channel.postMessage({ type: 'NEW_TRADE', trade: fullTrade });
          channel.close();
        } catch {}
      }

      // 2. Local storage event trigger for multi-window sync
      try {
        localStorage.setItem('rr_last_live_trade', JSON.stringify({ trade: fullTrade, timestamp: Date.now() }));
        window.dispatchEvent(new CustomEvent('rr_trade_executed', { detail: fullTrade }));
      } catch {}

      // 3. Post to backend server
      fetch('/api/trades', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fullTrade)
      }).catch(() => {});
    } catch {}
  }, [currentUser]);

  // Execute Buy Order (Supports CNC / MIS Intraday 5x leverage / Bracket / GTT)
  const executeBuyOrder = (
    symbol: string, 
    quantity: number, 
    orderType: 'MARKET' | 'LIMIT' | 'GTT', 
    limitPrice?: number,
    productType: ProductType = 'CNC',
    bracketOrder?: BracketOrderParams,
    gttTriggerPrice?: number
  ) => {
    const stock = stocks.find((s) => s.symbol === symbol);
    if (!stock) return { success: false, message: 'Stock not found' };
    if (quantity <= 0 || !Number.isInteger(quantity)) return { success: false, message: 'Please enter a valid quantity of shares (whole number)' };

    const executionPrice = (orderType === 'LIMIT' || orderType === 'GTT') && limitPrice ? limitPrice : stock.price;
    const totalCost = Number((executionPrice * quantity).toFixed(2));
    
    // MIS gives 5x leverage -> Margin required is only 20% (1/5th)
    const requiredMargin = productType === 'MIS' ? Number((totalCost / 5).toFixed(2)) : totalCost;

    if (requiredMargin > cashBalance) {
      return {
        success: false,
        message: `Insufficient margin! You need ₹${requiredMargin.toLocaleString('en-IN')} ${productType === 'MIS' ? '(5x Intraday Leverage)' : ''}, but have ₹${cashBalance.toLocaleString('en-IN')} available cash.`,
      };
    }

    const isMarketCurrentlyOpen = marketHoursMode === 'PRACTICE_24x7' || nseMarketInfo.isNSEMarketOpen;

    // Deduct margin used from available cash
    const newCash = Number((cashBalance - requiredMargin).toFixed(2));
    setCashBalance(newCash);

    if (isMarketCurrentlyOpen && orderType !== 'GTT') {
      // Execute immediately
      setHoldings((prev) => {
        const existing = prev[symbol];
        if (existing) {
          const newQty = existing.quantity + quantity;
          const newTotalInvested = Number((existing.totalInvested + totalCost).toFixed(2));
          const newAvg = Number((newTotalInvested / newQty).toFixed(2));
          return {
            ...prev,
            [symbol]: {
              symbol,
              quantity: newQty,
              avgBuyPrice: newAvg,
              totalInvested: newTotalInvested,
              productType,
              buyDate: existing.buyDate || new Date().toISOString()
            },
          };
        } else {
          return {
            ...prev,
            [symbol]: {
              symbol,
              quantity,
              avgBuyPrice: executionPrice,
              totalInvested: totalCost,
              productType,
              buyDate: new Date().toISOString()
            },
          };
        }
      });

      const newOrder: Order = {
        id: `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        symbol,
        stockName: stock.name,
        type: 'BUY',
        orderType,
        productType,
        quantity,
        price: executionPrice,
        totalAmount: totalCost,
        marginUsed: requiredMargin,
        timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        status: 'EXECUTED',
        executionTime: nseMarketInfo.istTimeString,
        bracketOrder,
      };

      setOrders((prev) => [newOrder, ...prev]);

      // Sync trade in real-time to Admin Dashboard
      syncTradeToAdminAndBroadcast({
        orderId: newOrder.id,
        symbol,
        stockName: stock.name,
        type: 'BUY',
        orderType,
        productType,
        quantity,
        price: executionPrice,
        totalAmount: totalCost,
        status: 'EXECUTED',
        realizedPnL: 0
      });

      awardXP(`order:${newOrder.id}`, 50, 'Executed a stock purchase');
      unlockBadge('badge-first-trade');
      confetti({ particleCount: 60, spread: 60, origin: { y: 0.7 } });

      // Generate Chanakya Copilot AI Trade Advice
      const isNear52High = (executionPrice / stock.high52) > 0.92;
      const isHighPe = stock.peRatio > (stock.industryPe * 1.3);
      const isOversold = stock.rsi14 ? stock.rsi14 < 35 : false;

      let adviceText = `You entered ${stock.name} at ₹${executionPrice.toFixed(2)}. Fundamentals indicate robust ROE of ${stock.roe}%.`;
      if (productType === 'MIS') {
        adviceText += ` ⚡ MIS Intraday active (5x leverage). Note: Auto square-off occurs at 3:20 PM IST.`;
      }
      if (isNear52High) {
        adviceText += ` Caution: Trading near 52-week peak. Strict Stop-Loss suggested at ₹${(executionPrice * 0.96).toFixed(2)}.`;
      } else if (isOversold) {
        adviceText += ` Great timing! RSI (${stock.rsi14}) is oversold indicating high upside bounce probability.`;
      }

      setCopilotFeedback({
        id: `CP-${Date.now()}`,
        stock,
        action: 'BUY',
        quantity,
        productType,
        advice: adviceText,
        suggestedStopLoss: Number((executionPrice * 0.95).toFixed(2)),
        suggestedTarget: Number((executionPrice * 1.08).toFixed(2)),
        riskRating: productType === 'MIS' ? 'HIGH' : isHighPe ? 'MODERATE' : 'LOW',
        timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
      });

      notifyUser(
        'Order Executed! 🚀',
        `Bought ${quantity} shares of ${stock.name} [${productType}] at ₹${executionPrice.toFixed(2)} (${productType === 'MIS' ? '5x Margin used: ₹' + requiredMargin.toLocaleString('en-IN') : 'Total: ₹' + totalCost.toLocaleString('en-IN')}).`,
        'SUCCESS',
        symbol
      );

      return {
        success: true,
        message: `Successfully bought ${quantity} share(s) of ${stock.name} (${symbol}) at ₹${executionPrice.toFixed(2)}!`,
      };
    } else {
      // Queue as Pending AMO or GTT
      const isGttOrder = orderType === 'GTT';
      const newOrder: Order = {
        id: `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        symbol,
        stockName: stock.name,
        type: 'BUY',
        orderType,
        productType,
        quantity,
        price: executionPrice,
        totalAmount: totalCost,
        marginUsed: requiredMargin,
        timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        status: 'PENDING',
        isAMO: !isGttOrder,
        placedTimeIST: nseMarketInfo.istTimeString,
        bracketOrder,
        gttTriggerPrice: gttTriggerPrice || executionPrice,
        gttCondition: (gttTriggerPrice || executionPrice) < stock.price ? 'BELOW' : 'ABOVE'
      };

      setOrders((prev) => [newOrder, ...prev]);

      notifyUser(
        isGttOrder ? 'GTT Order Active 🎯' : 'Order Placed (Pending Open) ⏳',
        isGttOrder 
          ? `GTT Trigger set for ${stock.name} at ₹${gttTriggerPrice?.toFixed(2)}. It will trigger automatically when price hits target.`
          : `After-Market BUY order for ${quantity} shares of ${stock.name} queued for 09:15 AM IST market open.`,
        'INFO',
        symbol
      );

      return {
        success: true,
        message: isGttOrder 
          ? `🎯 GTT Order placed! Trigger set at ₹${gttTriggerPrice?.toFixed(2)}.`
          : `⏳ After-Market BUY order for ${quantity} share(s) queued for market open!`,
      };
    }
  };

  // Execute Sell Order
  const executeSellOrder = (
    symbol: string, 
    quantity: number, 
    orderType: 'MARKET' | 'LIMIT' | 'GTT', 
    limitPrice?: number,
    productType: ProductType = 'CNC',
    bracketOrder?: BracketOrderParams,
    gttTriggerPrice?: number
  ) => {
    const stock = stocks.find((s) => s.symbol === symbol);
    if (!stock) return { success: false, message: 'Stock not found' };
    const currentHolding = holdings[symbol];

    const pendingSellShares = orders
      .filter((o) => o.status === 'PENDING' && o.type === 'SELL' && o.symbol === symbol)
      .reduce((sum, o) => sum + o.quantity, 0);

    const availableSharesToSell = (currentHolding ? currentHolding.quantity : 0) - pendingSellShares;

    if (!currentHolding || availableSharesToSell < quantity) {
      return {
        success: false,
        message: `You only have ${availableSharesToSell} share(s) available to sell (${pendingSellShares > 0 ? `${pendingSellShares} already queued in pending orders` : ''}). Cannot sell ${quantity}.`,
      };
    }

    const executionPrice = (orderType === 'LIMIT' || orderType === 'GTT') && limitPrice ? limitPrice : stock.price;
    const saleProceeds = Number((executionPrice * quantity).toFixed(2));
    const costBasisOfSoldShares = currentHolding.avgBuyPrice * quantity;
    const realizedPnL = saleProceeds - costBasisOfSoldShares;

    const isMarketCurrentlyOpen = marketHoursMode === 'PRACTICE_24x7' || nseMarketInfo.isNSEMarketOpen;

    if (isMarketCurrentlyOpen && orderType !== 'GTT') {
      const marginRefund = currentHolding.productType === 'MIS' ? (costBasisOfSoldShares / 5) : costBasisOfSoldShares;
      const cashToAdd = marginRefund + realizedPnL;
      const newCash = Number((cashBalance + cashToAdd).toFixed(2));
      setCashBalance(newCash);

      setHoldings((prev) => {
        const remainingQty = currentHolding.quantity - quantity;
        if (remainingQty <= 0) {
          const next = { ...prev };
          delete next[symbol];
          return next;
        } else {
          const remainingInvested = Number((remainingQty * currentHolding.avgBuyPrice).toFixed(2));
          return {
            ...prev,
            [symbol]: {
              ...currentHolding,
              quantity: remainingQty,
              totalInvested: remainingInvested,
            },
          };
        }
      });

      const estCharges = productType === 'MIS' ? 20.0 + (saleProceeds * 0.00025) : (saleProceeds * 0.001); // STT + exchange
      const riskPerShare = currentHolding.avgBuyPrice * 0.02 || 1;
      const profitPerShare = executionPrice - currentHolding.avgBuyPrice;
      const rMult = Number((profitPerShare / riskPerShare).toFixed(2));

      const newOrder: Order = {
        id: `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        symbol,
        stockName: stock.name,
        type: 'SELL',
        orderType,
        productType,
        quantity,
        price: executionPrice,
        totalAmount: saleProceeds,
        timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        status: 'EXECUTED',
        executionTime: nseMarketInfo.istTimeString,
        bracketOrder,
        realizedPnL: Number(realizedPnL.toFixed(2)),
        realizedPnLPercent: costBasisOfSoldShares > 0 ? Number(((realizedPnL / costBasisOfSoldShares) * 100).toFixed(2)) : 0,
        buyAvgPrice: Number(currentHolding.avgBuyPrice.toFixed(2)),
        closedAt: new Date().toISOString(),
        exitReason: realizedPnL >= 0 ? 'TARGET_HIT' : 'STOP_LOSS_HIT',
        charges: Number(estCharges.toFixed(2)),
        rMultiple: rMult,
        holdTime: 'Intraday (Same Day)'
      };

      setOrders((prev) => [newOrder, ...prev]);

      // Sync trade in real-time to Admin Dashboard
      syncTradeToAdminAndBroadcast({
        orderId: newOrder.id,
        symbol,
        stockName: stock.name,
        type: 'SELL',
        orderType,
        productType,
        quantity,
        price: executionPrice,
        totalAmount: saleProceeds,
        status: 'EXECUTED',
        realizedPnL: Number(realizedPnL.toFixed(2))
      });

      awardXP(`order:${newOrder.id}`, 50, 'Executed a stock sale');
      if (realizedPnL > 0) {
        unlockBadge('badge-profit-hunter');
        confetti({ particleCount: 70, spread: 65, origin: { y: 0.6 } });
      }

      notifyUser(
        'Order Executed! 💰',
        `Sold ${quantity} shares of ${stock.name} at ₹${executionPrice.toFixed(2)} (${realizedPnL >= 0 ? `+₹${realizedPnL.toFixed(2)} profit` : `-₹${Math.abs(realizedPnL).toFixed(2)} loss`}).`,
        'SUCCESS',
        symbol
      );

      return {
        success: true,
        message: `Successfully sold ${quantity} share(s) of ${stock.name} (${realizedPnL >= 0 ? `+₹${realizedPnL.toFixed(2)} profit` : `-₹${Math.abs(realizedPnL).toFixed(2)} loss`})!`,
      };
    } else {
      const isGttOrder = orderType === 'GTT';
      const newOrder: Order = {
        id: `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        symbol,
        stockName: stock.name,
        type: 'SELL',
        orderType,
        productType,
        quantity,
        price: executionPrice,
        totalAmount: saleProceeds,
        timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        status: 'PENDING',
        isAMO: !isGttOrder,
        placedTimeIST: nseMarketInfo.istTimeString,
        bracketOrder,
        gttTriggerPrice: gttTriggerPrice || executionPrice,
        gttCondition: (gttTriggerPrice || executionPrice) > stock.price ? 'ABOVE' : 'BELOW'
      };

      setOrders((prev) => [newOrder, ...prev]);

      notifyUser(
        isGttOrder ? 'GTT Exit Set 🎯' : 'Order Placed (Pending Open) ⏳',
        isGttOrder 
          ? `GTT Sell trigger set for ${stock.name} at ₹${gttTriggerPrice?.toFixed(2)}.`
          : `After-Market SELL order for ${quantity} shares of ${stock.name} queued for 09:15 AM IST market open.`,
        'INFO',
        symbol
      );

      return {
        success: true,
        message: isGttOrder 
          ? `🎯 GTT Exit trigger set at ₹${gttTriggerPrice?.toFixed(2)}.`
          : `⏳ After-Market SELL order queued for market open!`,
      };
    }
  };

  const cancelPendingOrder = (orderId: string) => {
    const targetOrder = orders.find((o) => o.id === orderId);
    if (!targetOrder || targetOrder.status !== 'PENDING') return;

    if (targetOrder.type === 'BUY') {
      const refund = targetOrder.marginUsed || targetOrder.totalAmount;
      setCashBalance((prev) => Number((prev + refund).toFixed(2)));
    }

    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: 'CANCELLED' as const } : o))
    );

    notifyUser(
      'Order Cancelled 🚫',
      `Pending ${targetOrder.type} order for ${targetOrder.quantity} shares of ${targetOrder.stockName} has been cancelled.`,
      'INFO',
      targetOrder.symbol
    );
  };

  // Option Trading Simulator Functions
  const executeOptionOrder = (
    underlying: 'NIFTY' | 'BANKNIFTY',
    optionType: 'CE' | 'PE',
    strikePrice: number,
    expiryDate: string,
    contracts: number, // Lots
    price: number,
    action: 'BUY' | 'SELL'
  ) => {
    const lotSize = underlying === 'NIFTY' ? 75 : 30;
    const totalPremium = Number((price * lotSize * contracts).toFixed(2));

    if (totalPremium > cashBalance) {
      return {
        success: false,
        message: `Insufficient capital! Premium requires ₹${totalPremium.toLocaleString('en-IN')}, but available cash is ₹${cashBalance.toLocaleString('en-IN')}.`
      };
    }

    setCashBalance(prev => Number((prev - totalPremium).toFixed(2)));

    const newPosition: OptionPosition = {
      id: `OPT-${Date.now()}`,
      underlying,
      optionType,
      strikePrice,
      expiryDate,
      contracts: contracts * lotSize,
      avgPrice: price,
      currentLtp: price,
      action,
      investedAmount: totalPremium,
      currentValue: totalPremium,
      pnl: 0,
      pnlPercent: 0,
      openedAt: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
    };

    setOptionPositions(prev => [newPosition, ...prev]);
    setUserXP(prev => prev + 60);
    confetti({ particleCount: 50, spread: 60 });

    // Stream live to Admin Dashboard
    syncTradeToAdminAndBroadcast({
      orderId: newPosition.id,
      symbol: `${underlying} ${strikePrice} ${optionType}`,
      stockName: `${underlying} Index Options`,
      type: action,
      orderType: 'MARKET',
      productType: 'MIS',
      quantity: contracts * lotSize,
      price: price,
      totalAmount: totalPremium,
      status: 'EXECUTED',
      realizedPnL: 0
    });

    notifyUser(
      'Option Contract Filled! 📈',
      `Successfully traded ${contracts} Lot(s) (${contracts * lotSize} qty) of ${underlying} ${strikePrice} ${optionType} at ₹${price.toFixed(2)}.`,
      'SUCCESS'
    );

    return {
      success: true,
      message: `Executed ${underlying} ${strikePrice} ${optionType} (${contracts} Lots) for premium ₹${totalPremium.toLocaleString('en-IN')}`
    };
  };

  const closeOptionPosition = (positionId: string) => {
    const pos = optionPositions.find(p => p.id === positionId);
    if (!pos) return { success: false, message: 'Position not found' };

    const payout = pos.currentValue;
    const realizedPnL = pos.action === 'BUY' ? (payout - pos.investedAmount) : (pos.investedAmount - payout);

    setCashBalance(prev => Number((prev + payout).toFixed(2)));
    setOptionPositions(prev => prev.filter(p => p.id !== positionId));

    // Stream square off to Admin Dashboard
    syncTradeToAdminAndBroadcast({
      orderId: `ORD-SQ-${Date.now()}`,
      symbol: `${pos.underlying} ${pos.strikePrice} ${pos.optionType}`,
      stockName: `${pos.underlying} Options Square-Off`,
      type: pos.action === 'BUY' ? 'SELL' : 'BUY',
      orderType: 'MARKET',
      productType: 'MIS',
      quantity: pos.contracts,
      price: pos.currentLtp,
      totalAmount: payout,
      status: 'EXECUTED',
      realizedPnL: Number(realizedPnL.toFixed(2))
    });

    notifyUser(
      'Option Position Squared Off 💰',
      `Closed ${pos.underlying} ${pos.strikePrice} ${pos.optionType} with ${pos.pnl >= 0 ? '+' : ''}₹${pos.pnl.toFixed(2)} P&L.`,
      pos.pnl >= 0 ? 'SUCCESS' : 'INFO'
    );

    return {
      success: true,
      message: `Position closed. Received ₹${payout.toLocaleString('en-IN')} (P&L: ${pos.pnl >= 0 ? '+' : ''}₹${pos.pnl.toFixed(2)})`
    };
  };

  const completeLesson = (lessonId: string, xpEarned: number) => {
    setCompletedLessonIds((previousIds) => {
      if (previousIds.includes(lessonId)) return previousIds;
      const nextIds = [...previousIds, lessonId];
      awardXP(`lesson:${lessonId}`, xpEarned, 'Completed an academy lesson');
      confetti({ particleCount: 90, spread: 80, origin: { y: 0.5 } });
      if (nextIds.length >= 3) unlockBadge('badge-scholar');
      return nextIds;
    });
  };

  const earnXP = (amount: number, reason?: string) => {
    const normalizedReason = (reason || `activity-${amount}`).toLowerCase().replace(/[^a-z0-9]+/g, '-');
    awardXP(`activity:${normalizedReason}`, amount, reason);
  };

  const resetSimulator = () => {
    setCashBalance(INITIAL_CASH);
    setHoldings({});
    setOrders([]);
    setOptionPositions([]);
    setPortfolioHistory([
      {
        timestamp: new Date().toISOString(),
        timeLabel: 'Reset',
        portfolioValue: INITIAL_CASH,
        investedValue: 0,
        cashBalance: INITIAL_CASH,
        totalPnL: 0,
      },
    ]);
  };

  return (
    <SimulatorContext.Provider
      value={{
        currentUser,
        loginUser,
        registerUser,
        loginWithGoogle,
        logoutUser,
        stocks,
        selectedStock,
        setSelectedStock,
        cashBalance,
        holdings,
        orders,
        watchlist,
        toggleWatchlist,
        watchlistGroups,
        activeWatchlistGroupId,
        setActiveWatchlistGroupId,
        createWatchlistGroup,
        deleteWatchlistGroup,
        addStockToGroup,
        removeStockFromGroup,
        executeBuyOrder,
        executeSellOrder,
        cancelPendingOrder,
        optionPositions,
        executeOptionOrder,
        closeOptionPosition,
        copilotFeedback,
        clearCopilotFeedback,
        stockNotes,
        updateStockNote,
        themeMode,
        setThemeMode,
        resetSimulator,
        portfolioValue,
        investedValue,
        totalPnL,
        totalPnLPercent,
        dayPnL,
        portfolioHistory,
        badges,
        userXP,
        userLevel,
        completedLessonIds,
        completeLesson,
        earnXP,
        marketIndices,
        marketNews,
        marketStatus: nseMarketInfo.isNSEMarketOpen ? 'NSE LIVE MARKET' : 'NSE MARKET CLOSED',
        isMarketLive: nseMarketInfo.isNSEMarketOpen,
        nseMarketInfo,
        marketHoursMode,
        setMarketHoursMode,
        notifyUser,
        refreshStocks: async () => {
          await Promise.allSettled([fetchStocks(), syncHoldingsRealTime(), fetchMarketSummary()]);
        },
        syncHoldingsRealTime,
        isSyncingHoldings,
        lastHoldingsSyncTime,
        unlockBadge,
        alerts,
        addAlert,
        addSmartAlert,
        removeAlert,
        notifications,
        markNotificationRead,
        markAllNotificationsRead,
        broadcastAnnouncement,
        dismissBroadcast,
      }}
    >
      {children}
    </SimulatorContext.Provider>
  );
};

export const useSimulator = () => {
  const context = useContext(SimulatorContext);
  if (!context) {
    throw new Error('useSimulator must be used within a SimulatorProvider');
  }
  return context;
};
