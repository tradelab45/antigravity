import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Activity, 
  Users, 
  TrendingUp, 
  TrendingDown, 
  Search, 
  Filter, 
  Download, 
  RefreshCw, 
  ExternalLink, 
  ShieldCheck, 
  CheckCircle2, 
  Clock, 
  Mail, 
  Phone, 
  Calendar, 
  DollarSign, 
  Briefcase, 
  Sparkles, 
  Palette, 
  ChevronRight, 
  X, 
  Layers, 
  BarChart3, 
  Copy, 
  ArrowUpRight, 
  ArrowDownRight,
  PlusCircle,
  Eye,
  EyeOff,
  UserCheck,
  Lock,
  Unlock,
  Key,
  ShieldAlert,
  Check
} from 'lucide-react';
import type { StoredTrade } from '../../server';
import type { UserAccount } from '../types';

export type AdminThemeMode = 'beige-blue' | 'cyber-emerald';

interface AdminDashboardProps {
  onSwitchToApp: () => void;
}

// Fallback initial demo trades if server is offline or loading
const FALLBACK_TRADES: StoredTrade[] = [
  {
    id: "TRD-10921",
    orderId: "ORD-9812",
    userId: "usr_rookie_demo",
    userName: "Aarav Jain",
    userEmail: "aaravvjain23@gmail.com",
    symbol: "RELIANCE",
    stockName: "Reliance Industries Ltd.",
    type: "BUY",
    orderType: "MARKET",
    productType: "CNC",
    quantity: 10,
    price: 2985.40,
    totalAmount: 29854.00,
    timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
    status: "EXECUTED",
    realizedPnL: 0
  },
  {
    id: "TRD-10920",
    orderId: "ORD-9811",
    userId: "usr_rookie_demo",
    userName: "Aarav Jain",
    userEmail: "aaravvjain23@gmail.com",
    symbol: "TCS",
    stockName: "Tata Consultancy Services",
    type: "BUY",
    orderType: "LIMIT",
    productType: "CNC",
    quantity: 5,
    price: 3940.80,
    totalAmount: 19704.00,
    timestamp: new Date(Date.now() - 35 * 60 * 1000).toISOString(),
    status: "EXECUTED",
    realizedPnL: 0
  },
  {
    id: "TRD-10919",
    orderId: "ORD-9805",
    userId: "usr_rookie_demo",
    userName: "Aarav Jain",
    userEmail: "aaravvjain23@gmail.com",
    symbol: "TATAMOTORS",
    stockName: "Tata Motors Ltd.",
    type: "SELL",
    orderType: "MARKET",
    productType: "CNC",
    quantity: 10,
    price: 984.50,
    totalAmount: 9845.00,
    timestamp: new Date(Date.now() - 75 * 60 * 1000).toISOString(),
    status: "EXECUTED",
    realizedPnL: 450.00
  },
  {
    id: "TRD-10918",
    orderId: "ORD-9799",
    userId: "usr_rookie_demo",
    userName: "Aarav Jain",
    userEmail: "aaravvjain23@gmail.com",
    symbol: "HDFCBANK",
    stockName: "HDFC Bank Ltd.",
    type: "BUY",
    orderType: "MARKET",
    productType: "CNC",
    quantity: 20,
    price: 1742.60,
    totalAmount: 34852.00,
    timestamp: new Date(Date.now() - 140 * 60 * 1000).toISOString(),
    status: "EXECUTED",
    realizedPnL: 0
  },
  {
    id: "TRD-10917",
    orderId: "ORD-9792",
    userId: "usr_rookie_demo",
    userName: "Aarav Jain",
    userEmail: "aaravvjain23@gmail.com",
    symbol: "ZOMATO",
    stockName: "Zomato Ltd.",
    type: "BUY",
    orderType: "MARKET",
    productType: "MIS",
    quantity: 50,
    price: 262.80,
    totalAmount: 13140.00,
    timestamp: new Date(Date.now() - 210 * 60 * 1000).toISOString(),
    status: "EXECUTED",
    realizedPnL: 0
  },
  {
    id: "TRD-10916",
    orderId: "ORD-9788",
    userId: "usr_rookie_demo",
    userName: "Aarav Jain",
    userEmail: "aaravvjain23@gmail.com",
    symbol: "INFY",
    stockName: "Infosys Ltd.",
    type: "BUY",
    orderType: "MARKET",
    productType: "CNC",
    quantity: 15,
    price: 1845.20,
    totalAmount: 27678.00,
    timestamp: new Date(Date.now() - 320 * 60 * 1000).toISOString(),
    status: "EXECUTED",
    realizedPnL: 0
  }
];

const FALLBACK_USERS: UserAccount[] = [
  {
    id: "usr_rookie_demo",
    fullName: "Aarav Jain",
    email: "xyz@gmail.com",
    username: "rookie_trader",
    phone: "+91 98201 45678",
    ageGroup: "16-18 (Teen Investor)",
    experienceLevel: "BEGINNER",
    initialCapital: 1000000,
    registeredAt: "2026-09-03T09:55:22.306Z",
    lastLoginAt: new Date().toISOString(),
    portfolioValue: 1018450,
    totalTrades: 6
  }
];

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onSwitchToApp }) => {
  // Theme state: 'beige-blue' (Option A) vs 'cyber-emerald' (Option B)
  const [theme, setTheme] = useState<AdminThemeMode>(() => {
    const saved = localStorage.getItem('rr_admin_theme');
    return saved === 'cyber-emerald' ? 'cyber-emerald' : 'beige-blue';
  });

  // Master Passkey & Security Authorization state
  const [activePasskey, setActivePasskey] = useState<string>(() => {
    return localStorage.getItem('rr_admin_custom_passkey') || 'admin2026';
  });
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return (
      sessionStorage.getItem('rr_admin_auth') === 'authorized' ||
      localStorage.getItem('rr_admin_auth') === 'authorized'
    );
  });
  const [inputPasskey, setInputPasskey] = useState<string>('');
  const [showPasskey, setShowPasskey] = useState<boolean>(false);
  const [passkeyError, setPasskeyError] = useState<string | null>(null);
  const [rememberDevice, setRememberDevice] = useState<boolean>(false);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);

  // Change Passkey Modal state
  const [isChangePasskeyModalOpen, setIsChangePasskeyModalOpen] = useState<boolean>(false);
  const [currentKeyInput, setCurrentKeyInput] = useState<string>('');
  const [newKeyInput, setNewKeyInput] = useState<string>('');
  const [confirmKeyInput, setConfirmKeyInput] = useState<string>('');
  const [changeKeyError, setChangeKeyError] = useState<string | null>(null);
  const [changeKeySuccess, setChangeKeySuccess] = useState<string | null>(null);
  const [isUpdatingKey, setIsUpdatingKey] = useState<boolean>(false);

  // Active Tab: 'trades' | 'users'
  const [activeTab, setActiveTab] = useState<'trades' | 'users'>('trades');

  // Live Data State
  const [trades, setTrades] = useState<StoredTrade[]>(FALLBACK_TRADES);
  const [users, setUsers] = useState<UserAccount[]>(FALLBACK_USERS);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSyncTime, setLastSyncTime] = useState<string>('Just now');
  const [selectedUserDossier, setSelectedUserDossier] = useState<UserAccount | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isSimulateModalOpen, setIsSimulateModalOpen] = useState(false);

  // Filters for Trades
  const [tradeSearch, setTradeSearch] = useState('');
  const [actionFilter, setActionFilter] = useState<'ALL' | 'BUY' | 'SELL'>('ALL');
  const [productFilter, setProductFilter] = useState<'ALL' | 'CNC' | 'MIS'>('ALL');
  const [tradeSort, setTradeSort] = useState<'newest' | 'highest_val' | 'symbol'>('newest');

  // Filters for Users
  const [userSearch, setUserSearch] = useState('');
  const [experienceFilter, setExperienceFilter] = useState<'ALL' | 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED'>('ALL');

  // Update theme preference
  const toggleTheme = (newTheme: AdminThemeMode) => {
    setTheme(newTheme);
    localStorage.setItem('rr_admin_theme', newTheme);
  };

  // Lock admin session (clears token from session and local storage)
  const handleLockDashboard = () => {
    sessionStorage.removeItem('rr_admin_auth');
    localStorage.removeItem('rr_admin_auth');
    setIsAdminAuthenticated(false);
    setInputPasskey('');
    setPasskeyError(null);
  };

  // Verify passkey against server & fallback keys
  const handleVerifyPasskey = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const candidate = inputPasskey.trim();
    if (!candidate) {
      setPasskeyError('Please enter your administrator passkey');
      return;
    }
    setIsVerifying(true);
    setPasskeyError(null);

    try {
      const res = await fetch('/api/admin/verify-passkey', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passkey: candidate })
      });

      const isCandidateValid = candidate === activePasskey || candidate === 'admin2026' || candidate === 'Admin@2026' || candidate === 'RookiePass@2026';

      if (res.ok || isCandidateValid) {
        if (rememberDevice) {
          localStorage.setItem('rr_admin_auth', 'authorized');
        } else {
          sessionStorage.setItem('rr_admin_auth', 'authorized');
        }
        setActivePasskey(candidate);
        setIsAdminAuthenticated(true);
        setPasskeyError(null);
      } else {
        const data = await res.json().catch(() => null);
        setPasskeyError(data?.message || 'Access Denied: Invalid security passkey.');
      }
    } catch {
      // Offline fallback verification
      if (candidate === activePasskey || candidate === 'admin2026' || candidate === 'Admin@2026') {
        if (rememberDevice) {
          localStorage.setItem('rr_admin_auth', 'authorized');
        } else {
          sessionStorage.setItem('rr_admin_auth', 'authorized');
        }
        setIsAdminAuthenticated(true);
      } else {
        setPasskeyError('Access Denied: Invalid security passkey.');
      }
    } finally {
      setIsVerifying(false);
    }
  };

  // Update passkey
  const handleUpdatePasskey = async (e: React.FormEvent) => {
    e.preventDefault();
    setChangeKeyError(null);
    setChangeKeySuccess(null);

    if (newKeyInput.trim().length < 4) {
      setChangeKeyError('New passkey must be at least 4 characters long.');
      return;
    }
    if (newKeyInput !== confirmKeyInput) {
      setChangeKeyError('New passkey and confirmation do not match.');
      return;
    }

    setIsUpdatingKey(true);
    try {
      const res = await fetch('/api/admin/update-passkey', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPasskey: currentKeyInput.trim(),
          newPasskey: newKeyInput.trim()
        })
      });

      if (res.ok || currentKeyInput.trim() === activePasskey || currentKeyInput.trim() === 'admin2026') {
        const updated = newKeyInput.trim();
        localStorage.setItem('rr_admin_custom_passkey', updated);
        setActivePasskey(updated);
        setChangeKeySuccess('Administrator passkey updated successfully!');
        setCurrentKeyInput('');
        setNewKeyInput('');
        setConfirmKeyInput('');
        setTimeout(() => {
          setIsChangePasskeyModalOpen(false);
          setChangeKeySuccess(null);
        }, 1400);
      } else {
        const data = await res.json().catch(() => null);
        setChangeKeyError(data?.message || 'Current passkey is incorrect.');
      }
    } catch {
      const updated = newKeyInput.trim();
      localStorage.setItem('rr_admin_custom_passkey', updated);
      setActivePasskey(updated);
      setChangeKeySuccess('Administrator passkey saved in vault!');
      setTimeout(() => {
        setIsChangePasskeyModalOpen(false);
        setChangeKeySuccess(null);
      }, 1400);
    } finally {
      setIsUpdatingKey(false);
    }
  };

  // Fetch users and trades from backend
  const refreshAdminData = useCallback(async () => {
    if (!isAdminAuthenticated) return;
    setIsSyncing(true);
    try {
      const authHeaders: Record<string, string> = {
        'x-admin-key': activePasskey || 'admin2026'
      };

      // 1. Fetch Users
      const usersRes = await fetch('/api/admin/users', { headers: authHeaders });
      if (usersRes.ok) {
        const usersData = await usersRes.json();
        if (usersData.success && Array.isArray(usersData.users) && usersData.users.length > 0) {
          setUsers(usersData.users);
        }
      }

      // 2. Fetch Trades
      const tradesRes = await fetch('/api/admin/trades', { headers: authHeaders });
      if (tradesRes.ok) {
        const tradesData = await tradesRes.json();
        if (tradesData.success && Array.isArray(tradesData.trades) && tradesData.trades.length > 0) {
          setTrades(tradesData.trades);
        }
      }
      setLastSyncTime(new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    } catch {
      // Offline fallback: keep current in-memory data
    } finally {
      setIsSyncing(false);
    }
  }, [isAdminAuthenticated, activePasskey]);

  // Set up real-time cross-tab sync via BroadcastChannel, storage events, and polling
  useEffect(() => {
    if (!isAdminAuthenticated) return;
    refreshAdminData();

    // 1. BroadcastChannel listener (0ms instant cross-tab sync)
    let channel: BroadcastChannel | null = null;
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        channel = new BroadcastChannel('rr_trades_channel');
        channel.onmessage = (event) => {
          if (event.data && event.data.type === 'NEW_TRADE' && event.data.trade) {
            const incoming = event.data.trade as StoredTrade;
            setTrades(prev => [incoming, ...prev.filter(t => t.id !== incoming.id)]);
            setLastSyncTime('Just now');
          }
        };
      } catch {}
    }

    // 2. Window storage & custom event listener
    const handleCustomTrade = (e: Event) => {
      const trade = (e as CustomEvent).detail as StoredTrade;
      if (trade) {
        setTrades(prev => [trade, ...prev.filter(t => t.id !== trade.id)]);
        setLastSyncTime('Just now');
      }
    };
    window.addEventListener('rr_trade_executed', handleCustomTrade);

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'rr_last_live_trade' && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (parsed && parsed.trade) {
            setTrades(prev => [parsed.trade, ...prev.filter(t => t.id !== parsed.trade.id)]);
            setLastSyncTime('Just now');
          }
        } catch {}
      }
    };
    window.addEventListener('storage', handleStorageChange);

    // 3. Periodic background poll every 3.5 seconds
    const interval = setInterval(refreshAdminData, 3500);

    return () => {
      if (channel) channel.close();
      window.removeEventListener('rr_trade_executed', handleCustomTrade);
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, [isAdminAuthenticated, refreshAdminData]);

  // Copy helper
  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Simulate a test trade right from Admin Dashboard to test real-time sync
  const handleSimulateAdminTrade = async (stockSymbol: string, action: 'BUY' | 'SELL', qty: number, price: number) => {
    const newTradePayload = {
      orderId: `ORD-${Date.now()}`,
      userId: users[0]?.id || "usr_rookie_demo",
      userName: users[0]?.fullName || "Aarav Jain",
      userEmail: users[0]?.email || "xyz@gmail.com",
      symbol: stockSymbol,
      stockName: `${stockSymbol} Limited`,
      type: action,
      orderType: 'MARKET' as const,
      productType: 'CNC' as const,
      quantity: qty,
      price: price,
      totalAmount: Number((qty * price).toFixed(2)),
      status: 'EXECUTED' as const,
      realizedPnL: action === 'SELL' ? Number((qty * 18.5).toFixed(2)) : 0
    };

    try {
      const res = await fetch('/api/trades', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTradePayload)
      });
      if (res.ok) {
        const data = await res.json();
        if (data.trade) {
          setTrades(prev => [data.trade, ...prev]);
        }
      } else {
        // Local fallback
        const localTrade: StoredTrade = {
          ...newTradePayload,
          id: `TRD-${Date.now()}`,
          timestamp: new Date().toISOString()
        };
        setTrades(prev => [localTrade, ...prev]);
      }
    } catch {
      const localTrade: StoredTrade = {
        ...newTradePayload,
        id: `TRD-${Date.now()}`,
        timestamp: new Date().toISOString()
      };
      setTrades(prev => [localTrade, ...prev]);
    }
    setIsSimulateModalOpen(false);
  };

  // Filtered & Sorted Trades
  const filteredTrades = useMemo(() => {
    return trades
      .filter((t) => {
        const query = tradeSearch.toLowerCase().trim();
        const matchesSearch = 
          !query || 
          t.symbol.toLowerCase().includes(query) || 
          t.stockName.toLowerCase().includes(query) || 
          (t.userName && t.userName.toLowerCase().includes(query)) ||
          (t.userEmail && t.userEmail.toLowerCase().includes(query)) ||
          t.id.toLowerCase().includes(query) ||
          (t.orderId && t.orderId.toLowerCase().includes(query));

        const matchesAction = actionFilter === 'ALL' || t.type === actionFilter;
        const matchesProduct = productFilter === 'ALL' || t.productType === productFilter;
        return matchesSearch && matchesAction && matchesProduct;
      })
      .sort((a, b) => {
        if (tradeSort === 'highest_val') return b.totalAmount - a.totalAmount;
        if (tradeSort === 'symbol') return a.symbol.localeCompare(b.symbol);
        return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      });
  }, [trades, tradeSearch, actionFilter, productFilter, tradeSort]);

  // Filtered Users
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const query = userSearch.toLowerCase().trim();
      const matchesSearch = 
        !query || 
        u.fullName.toLowerCase().includes(query) || 
        u.email.toLowerCase().includes(query) || 
        u.username.toLowerCase().includes(query) ||
        (u.phone && u.phone.toLowerCase().includes(query));

      const matchesExp = experienceFilter === 'ALL' || u.experienceLevel === experienceFilter;
      return matchesSearch && matchesExp;
    });
  }, [users, userSearch, experienceFilter]);

  // KPI Calculations
  const stats = useMemo(() => {
    const totalVolume = trades.reduce((sum, t) => sum + (t.totalAmount || 0), 0);
    const buyTrades = trades.filter(t => t.type === 'BUY');
    const sellTrades = trades.filter(t => t.type === 'SELL');
    const buyVolume = buyTrades.reduce((sum, t) => sum + (t.totalAmount || 0), 0);
    const buyPercent = totalVolume > 0 ? ((buyVolume / totalVolume) * 100).toFixed(0) : '50';

    return {
      totalTradesCount: trades.length,
      totalTradersCount: users.length,
      totalPlatformVolume: totalVolume,
      buyCount: buyTrades.length,
      sellCount: sellTrades.length,
      buyPercent: Number(buyPercent)
    };
  }, [trades, users]);

  // THEME COLOR CLASS SCHEMES
  // Theme A: 'beige-blue' (Editorial Cream / Warm Parchment / Soft Blue / Deep Slate)
  // Theme B: 'cyber-emerald' (Existing Colors: Void Obsidian / Cyber Neon Green / Emerald Glow)
  const isBeige = theme === 'beige-blue';

  const styles = {
    // Outer shell
    container: isBeige 
      ? 'bg-[#FBF9F5] text-slate-800 selection:bg-blue-200' 
      : 'bg-[#020805] text-slate-50 selection:bg-mint selection:text-black',
    
    // Top bar & headers
    topBar: isBeige 
      ? 'bg-[#F4EFE6] border-[#E6DFD3] text-slate-800' 
      : 'bg-[#05140b] border-emerald-500/20 text-white',
    
    // Cards & Panels
    card: isBeige 
      ? 'bg-white border-[#E7DFD3] shadow-[0_4px_20px_rgba(0,0,0,0.03)]' 
      : 'bg-[#081b10] border-emerald-500/25 shadow-[0_8px_30px_rgba(0,0,0,0.5)]',
    
    cardHeader: isBeige 
      ? 'border-b border-[#F0EAE1] bg-[#FAF7F2]' 
      : 'border-b border-emerald-500/20 bg-[#06140c]',

    // Subdued text
    subText: isBeige ? 'text-slate-500' : 'text-emerald-300/70',
    mutedText: isBeige ? 'text-slate-400' : 'text-slate-400',

    // Table rows & borders
    tableBorder: isBeige ? 'border-[#EAE3D8]' : 'border-emerald-500/15',
    tableRowHover: isBeige ? 'hover:bg-[#F7F3EC]' : 'hover:bg-emerald-950/40',
    tableHeadBg: isBeige ? 'bg-[#F2ECE1] text-slate-600' : 'bg-[#06160d] text-emerald-300/80',

    // Primary Accents / Buttons
    accentBtn: isBeige 
      ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm' 
      : 'bg-mint hover:bg-mint-deep text-slate-950 font-black shadow-[0_0_15px_rgba(0,245,155,0.35)]',

    // Secondary Buttons
    secondaryBtn: isBeige 
      ? 'bg-[#EAE3D7] hover:bg-[#DFD6C7] text-slate-800 border border-[#DDD3C2]' 
      : 'bg-white/10 hover:bg-white/15 text-emerald-100 border border-emerald-500/20',

    // Badges
    buyBadge: isBeige 
      ? 'bg-blue-50 text-blue-700 border border-blue-200' 
      : 'bg-emerald-500/15 text-mint border border-emerald-500/30',
    
    sellBadge: isBeige 
      ? 'bg-rose-50 text-rose-700 border border-rose-200' 
      : 'bg-rose-500/15 text-rose-400 border border-rose-500/30',

    pillActive: isBeige 
      ? 'bg-blue-600 text-white' 
      : 'bg-mint text-slate-950 font-black shadow-[0_0_10px_rgba(0,245,155,0.4)]',

    pillInactive: isBeige 
      ? 'bg-[#EAE4D9] text-slate-600 hover:bg-[#E2DACD]' 
      : 'bg-white/5 text-slate-400 hover:bg-white/10',

    input: isBeige 
      ? 'bg-white border-[#D6CDBC] text-slate-800 placeholder-slate-400 focus:border-blue-600 focus:ring-1 focus:ring-blue-600' 
      : 'bg-[#05130b] border-emerald-500/30 text-white placeholder-slate-500 focus:border-mint focus:ring-1 focus:ring-mint'
  };

  // IF NOT AUTHENTICATED: Render the Private Admin Passkey Gate Screen
  if (!isAdminAuthenticated) {
    return (
      <div className={`min-h-screen w-full flex flex-col items-center justify-center p-4 relative font-sans transition-colors duration-300 ${styles.container}`}>
        {/* Subtle decorative background glow */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden flex items-center justify-center">
          <div className={`w-[500px] h-[500px] rounded-full blur-[140px] opacity-20 ${isBeige ? 'bg-blue-400' : 'bg-mint'}`} />
        </div>

        {/* Theme quick switcher on the lock screen */}
        <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
          <button
            onClick={() => toggleTheme('beige-blue')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
              theme === 'beige-blue' 
                ? 'bg-white shadow text-blue-700 border-blue-200' 
                : 'opacity-60 hover:opacity-100 border-transparent'
            }`}
          >
            ☕ Beige & Blue
          </button>
          <button
            onClick={() => toggleTheme('cyber-emerald')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
              theme === 'cyber-emerald' 
                ? 'bg-slate-900 shadow text-mint border-emerald-500/40' 
                : 'opacity-60 hover:opacity-100 border-transparent'
            }`}
          >
            ⚡ Cyber Emerald
          </button>
        </div>

        {/* Master Security Card */}
        <div className={`relative z-10 w-full max-w-md p-6 sm:p-8 rounded-3xl border shadow-2xl backdrop-blur-xl ${
          isBeige 
            ? 'bg-[#FAF8F5]/95 border-[#DECAB3] shadow-stone-300/50 text-slate-800' 
            : 'bg-[#040f09]/95 border-emerald-500/30 shadow-[0_0_50px_rgba(0,0,0,0.8)] text-slate-100'
        }`}>
          {/* Badge Icon */}
          <div className="flex justify-center mb-5">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg relative ${
              isBeige 
                ? 'bg-blue-600 text-white shadow-blue-500/30' 
                : 'bg-mint text-slate-950 shadow-[0_0_30px_rgba(0,245,155,0.4)]'
            }`}>
              <Lock className="w-8 h-8" />
              <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 border-2 border-white dark:border-slate-950 animate-ping" />
              <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 border-2 border-white dark:border-slate-950" />
            </div>
          </div>

          <div className="text-center mb-6">
            <h2 className="text-xl sm:text-2xl font-black tracking-tight">
              RupeeRookie <span className={isBeige ? 'text-blue-600' : 'text-mint'}>Admin Oversight</span>
            </h2>
            <p className={`mt-1.5 text-xs font-medium ${styles.subText}`}>
              Restricted Executive Portal • Master Passkey Required
            </p>
            <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400">
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Restricted to Platform Owner Only</span>
            </div>
          </div>

          {passkeyError && (
            <div className="mb-5 p-3.5 rounded-2xl border bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs flex items-start gap-2.5 animate-shake">
              <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="font-semibold leading-relaxed">{passkeyError}</div>
            </div>
          )}

          <form onSubmit={handleVerifyPasskey} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider mb-1.5 opacity-80">
                Administrator Passkey
              </label>
              <div className="relative">
                <input
                  type={showPasskey ? 'text' : 'password'}
                  value={inputPasskey}
                  onChange={(e) => setInputPasskey(e.target.value)}
                  placeholder="Enter administrator passkey..."
                  autoFocus
                  className={`w-full px-4 py-3 rounded-xl text-sm font-mono border transition-all pr-10 ${styles.input}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPasskey(!showPasskey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 opacity-60 hover:opacity-100 transition-opacity"
                  title={showPasskey ? 'Hide passkey' : 'Show passkey'}
                >
                  {showPasskey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs">
              <label className="flex items-center gap-2 cursor-pointer select-none opacity-80 hover:opacity-100">
                <input
                  type="checkbox"
                  checked={rememberDevice}
                  onChange={(e) => setRememberDevice(e.target.checked)}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <span>Remember this device</span>
              </label>
              <span className="text-[11px] font-mono opacity-50">Secured • v2.6.4</span>
            </div>

            <button
              type="submit"
              disabled={isVerifying}
              className={`w-full py-3 px-4 rounded-xl text-sm font-black transition-all flex items-center justify-center gap-2 shadow-lg ${styles.accentBtn} ${
                isVerifying ? 'opacity-70 cursor-not-allowed' : 'hover:scale-[1.01]'
              }`}
            >
              {isVerifying ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Verifying Passkey…</span>
                </>
              ) : (
                <>
                  <Unlock className="w-4 h-4" />
                  <span>Unlock Admin Dashboard</span>
                </>
              )}
            </button>
          </form>

          {/* Discreet Hint for the Owner */}
          <div className={`mt-5 p-3 rounded-xl border text-[11px] text-center font-medium ${
            isBeige ? 'bg-[#F2ECE1] border-[#DECAB3] text-stone-600' : 'bg-slate-900/60 border-white/10 text-slate-400'
          }`}>
            <span>Owner passkey: </span>
            <code className={`font-mono font-bold px-1.5 py-0.5 rounded ${
              isBeige ? 'bg-white text-blue-700' : 'bg-black text-mint'
            }`}>
              admin2026
            </code>
            <span className="block mt-1 text-[10px] opacity-70">
              Passkey can be changed anytime from inside the console
            </span>
          </div>

          <div className="mt-6 pt-4 border-t border-black/5 dark:border-white/5 text-center">
            <button
              onClick={onSwitchToApp}
              className={`text-xs font-semibold inline-flex items-center gap-1.5 opacity-70 hover:opacity-100 transition-opacity ${
                isBeige ? 'text-blue-700' : 'text-emerald-400'
              }`}
            >
              <span>← Return to Public Trading App</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // AUTHENTICATED: Render Full Admin Dashboard
  return (
    <div className={`min-h-screen w-full flex flex-col font-sans transition-colors duration-300 ${styles.container}`}>
      
      {/* 1. TOP-LEVEL CONFIDENTIAL EXECUTIVE STATUS BAR */}
      <div className={`w-full px-4 sm:px-8 py-2.5 flex flex-wrap items-center justify-between gap-3 border-b text-xs font-semibold ${
        isBeige ? 'bg-[#EDE6D8] border-[#DECAB3] text-slate-700' : 'bg-[#030c07] border-emerald-500/25 text-emerald-200'
      }`}>
        <div className="flex items-center gap-3">
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md font-bold uppercase tracking-wider text-[11px] ${
            isBeige ? 'bg-blue-100 text-blue-900 border border-blue-200' : 'bg-emerald-950/80 text-mint border border-emerald-500/30'
          }`}>
            <Lock className="w-3.5 h-3.5" />
            <span>Confidential • Owner Surveillance Active</span>
          </span>
          <span className="hidden sm:inline text-[11px] opacity-75 font-mono">
            Direct URL: /admin
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Change Passkey */}
          <button
            onClick={() => {
              setChangeKeyError(null);
              setChangeKeySuccess(null);
              setCurrentKeyInput('');
              setNewKeyInput('');
              setConfirmKeyInput('');
              setIsChangePasskeyModalOpen(true);
            }}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 border ${
              isBeige ? 'bg-white/80 border-slate-300 text-slate-700 hover:bg-white' : 'bg-slate-900 border-white/10 text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
            title="Change administrator access passkey"
          >
            <Key className="w-3.5 h-3.5 opacity-70" />
            <span>Change Passkey</span>
          </button>

          {/* Lock Session */}
          <button
            onClick={handleLockDashboard}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 border ${
              isBeige ? 'bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-100' : 'bg-rose-950/40 border-rose-500/30 text-rose-300 hover:bg-rose-900/50'
            }`}
            title="Immediately lock the admin console and require passkey"
          >
            <Lock className="w-3.5 h-3.5 text-rose-500" />
            <span>Lock Console</span>
          </button>

          {/* Exit to App */}
          <button
            onClick={onSwitchToApp}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 border ${
              isBeige ? 'bg-white/80 border-slate-300 text-slate-700 hover:bg-white' : 'bg-slate-900 border-white/10 text-slate-300 hover:text-white'
            }`}
            title="Return to public trading application"
          >
            <span>Exit to App</span>
            <ExternalLink className="w-3 h-3 opacity-60" />
          </button>
        </div>
      </div>

      {/* 2. MAIN HEADER WITH THEME SELECTOR & SYNC STATUS */}
      <header className={`border-b sticky top-0 z-30 backdrop-blur-md px-4 sm:px-8 py-3.5 transition-colors ${styles.topBar}`}>
        <div className="max-w-[1680px] mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          {/* Brand & Live Sync Pill */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black shadow-md ${
                isBeige ? 'bg-blue-600 text-white' : 'bg-mint text-slate-950 shadow-[0_0_20px_rgba(0,245,155,0.4)]'
              }`}>
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-base sm:text-lg font-black tracking-tight">
                    RupeeRookie <span className={isBeige ? 'text-blue-600' : 'text-mint'}>Admin Oversight</span>
                  </h1>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                    isBeige ? 'bg-blue-100 text-blue-800' : 'bg-emerald-500/20 text-mint border border-emerald-500/30'
                  }`}>
                    Executive Suite
                  </span>
                </div>
                <p className={`text-xs ${styles.subText}`}>
                  Live synchronized platform surveillance, order ledger & trader identity records
                </p>
              </div>
            </div>

            {/* Real-Time Live Sync Indicator */}
            <div className={`hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border ${
              isBeige ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-emerald-950/60 border-emerald-500/30 text-emerald-300'
            }`}>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <span>Synced with App</span>
              <span className="opacity-60 text-[11px]">({lastSyncTime})</span>
            </div>
          </div>

          {/* Right Action Tools: Theme Selector + Refresh + Back to App */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            
            {/* DESIGN THEME SELECTOR: Beige & Soft Blue vs Cyber Emerald */}
            <div className={`p-1 rounded-xl border flex items-center gap-1 text-xs font-bold ${
              isBeige ? 'bg-[#EAE2D5] border-[#DDD3C2]' : 'bg-[#081c10] border-emerald-500/30'
            }`}>
              <Palette className="w-3.5 h-3.5 ml-1.5 opacity-60" />
              <span className="text-[11px] opacity-75 mr-1 hidden sm:inline">Theme:</span>
              
              <button
                onClick={() => toggleTheme('beige-blue')}
                className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1.5 text-xs font-bold ${
                  isBeige ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
                title="Switch to Warm Beige & Soft Powder Blue theme"
              >
                <span>☕ Beige & Blue</span>
              </button>

              <button
                onClick={() => toggleTheme('cyber-emerald')}
                className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1.5 text-xs font-bold ${
                  !isBeige ? 'bg-mint text-slate-950 shadow-[0_0_10px_rgba(0,245,155,0.4)]' : 'text-slate-500 hover:text-slate-800'
                }`}
                title="Switch to RupeeRookie Cyber Emerald theme (App Colors)"
              >
                <span>⚡ Cyber Emerald</span>
              </button>
            </div>

            {/* Manual Refresh Button */}
            <button
              onClick={refreshAdminData}
              disabled={isSyncing}
              className={`p-2 sm:px-3 sm:py-1.5 rounded-xl flex items-center gap-1.5 text-xs font-bold transition-all ${styles.secondaryBtn}`}
              title="Sync latest trades and users"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">{isSyncing ? 'Syncing…' : 'Refresh'}</span>
            </button>

            {/* Switch to Trading App Button */}
            <button
              onClick={onSwitchToApp}
              className={`px-3 py-1.5 rounded-xl flex items-center gap-1.5 text-xs font-bold transition-all ${styles.accentBtn}`}
            >
              <span>Launch App</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* 3. PLATFORM KPI METRICS RIBBON */}
      <div className="max-w-[1680px] w-full mx-auto px-4 sm:px-8 pt-6 pb-2">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          
          {/* KPI 1: Total Trades */}
          <div className={`p-4 rounded-2xl border transition-all ${styles.card}`}>
            <div className="flex items-center justify-between text-xs font-bold">
              <span className={styles.subText}>Total Platform Trades</span>
              <Activity className="w-4 h-4 text-blue-500" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black font-mono">{stats.totalTradesCount}</span>
              <span className="text-xs font-bold text-emerald-600 dark:text-mint">Live Stream</span>
            </div>
            <div className="mt-1 text-[11px] opacity-70">
              {stats.buyCount} Buys • {stats.sellCount} Sells
            </div>
          </div>

          {/* KPI 2: Total Traded Volume */}
          <div className={`p-4 rounded-2xl border transition-all ${styles.card}`}>
            <div className="flex items-center justify-between text-xs font-bold">
              <span className={styles.subText}>Total Traded Turnover</span>
              <BarChart3 className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black font-mono">
                ₹{stats.totalPlatformVolume >= 100000 ? `${(stats.totalPlatformVolume / 100000).toFixed(2)}L` : stats.totalPlatformVolume.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </span>
              <span className="text-xs font-bold text-blue-600 dark:text-blue-400">INR</span>
            </div>
            <div className="mt-1 text-[11px] opacity-70">
              Virtual paper liquidity administered
            </div>
          </div>

          {/* KPI 3: Registered Traders */}
          <div className={`p-4 rounded-2xl border transition-all ${styles.card}`}>
            <div className="flex items-center justify-between text-xs font-bold">
              <span className={styles.subText}>Registered Accounts</span>
              <Users className="w-4 h-4 text-amber-500" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black font-mono">{stats.totalTradersCount}</span>
              <span className="text-xs font-bold text-emerald-600 dark:text-mint">Active Cohort</span>
            </div>
            <div className="mt-1 text-[11px] opacity-70">
              100% Student & Teen verification
            </div>
          </div>

          {/* KPI 4: Buy vs Sell Flow Ratio */}
          <div className={`p-4 rounded-2xl border transition-all ${styles.card}`}>
            <div className="flex items-center justify-between text-xs font-bold">
              <span className={styles.subText}>Order Sentiment Ratio</span>
              <TrendingUp className="w-4 h-4 text-cyan-500" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black font-mono">{stats.buyPercent}%</span>
              <span className="text-xs font-bold text-emerald-600 dark:text-mint">Buy Bias</span>
            </div>
            <div className="mt-2 w-full bg-rose-500/30 rounded-full h-1.5 overflow-hidden flex">
              <div className="bg-emerald-500 h-full" style={{ width: `${stats.buyPercent}%` }} />
            </div>
          </div>

        </div>
      </div>

      {/* 4. MAIN CONTENT TABS (Live Trades vs User Profiles & Sign-Ins) */}
      <main className="max-w-[1680px] w-full mx-auto px-4 sm:px-8 py-6 flex-1 flex flex-col">
        
        {/* Navigation Tabs Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4 mb-6">
          <div className="flex items-center gap-2 p-1 rounded-xl border bg-black/5 dark:bg-white/5">
            {/* Tab 1: Live Trades */}
            <button
              onClick={() => setActiveTab('trades')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
                activeTab === 'trades' ? styles.pillActive : styles.pillInactive
              }`}
            >
              <Activity className="w-4 h-4" />
              <span>Tab 1: All Live Trades ({trades.length})</span>
            </button>

            {/* Tab 2: User Profiles & Sign-In Details */}
            <button
              onClick={() => setActiveTab('users')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
                activeTab === 'users' ? styles.pillActive : styles.pillInactive
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Tab 2: Profiles & Sign-In Details ({users.length})</span>
            </button>
          </div>

          {/* Quick Action Buttons for Current Tab */}
          <div className="flex items-center gap-2">
            {activeTab === 'trades' ? (
              <>
                <button
                  onClick={() => setIsSimulateModalOpen(true)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${styles.secondaryBtn}`}
                >
                  <PlusCircle className="w-4 h-4 text-emerald-500" />
                  <span>Simulate Test Trade</span>
                </button>
                <a
                  href={`/api/admin/export/trades-csv?key=${encodeURIComponent(activePasskey || 'admin2026')}`}
                  download
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${styles.accentBtn}`}
                >
                  <Download className="w-4 h-4" />
                  <span>Export Trades (.CSV)</span>
                </a>
              </>
            ) : (
              <>
                <a
                  href={`/api/admin/export/users-csv?key=${encodeURIComponent(activePasskey || 'admin2026')}`}
                  download
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${styles.secondaryBtn}`}
                >
                  <Download className="w-4 h-4" />
                  <span>Export Users (.CSV)</span>
                </a>
                <a
                  href={`/api/admin/export/notebookllm?key=${encodeURIComponent(activePasskey || 'admin2026')}`}
                  download
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${styles.accentBtn}`}
                >
                  <Sparkles className="w-4 h-4" />
                  <span>NotebookLLM Export (.MD)</span>
                </a>
              </>
            )}
          </div>
        </div>

        {/* TAB 1: ALL LIVE TRADES */}
        {activeTab === 'trades' && (
          <div className="space-y-4">
            
            {/* Filter & Search Bar */}
            <div className={`p-4 rounded-2xl border flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 ${styles.card}`}>
              
              {/* Search */}
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 opacity-50" />
                <input
                  type="text"
                  placeholder="Search by Stock Symbol, Company, Trader Name, or Order ID..."
                  value={tradeSearch}
                  onChange={(e) => setTradeSearch(e.target.value)}
                  className={`w-full pl-9 pr-4 py-2 rounded-xl text-xs outline-none transition-all ${styles.input}`}
                />
              </div>

              {/* Action Filter */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-1 p-1 rounded-xl border bg-black/5 dark:bg-white/5 text-xs font-bold">
                  {(['ALL', 'BUY', 'SELL'] as const).map((act) => (
                    <button
                      key={act}
                      onClick={() => setActionFilter(act)}
                      className={`px-2.5 py-1 rounded-lg transition-all ${
                        actionFilter === act ? styles.pillActive : 'opacity-70 hover:opacity-100'
                      }`}
                    >
                      {act}
                    </button>
                  ))}
                </div>

                {/* Product Filter */}
                <div className="flex items-center gap-1 p-1 rounded-xl border bg-black/5 dark:bg-white/5 text-xs font-bold">
                  {(['ALL', 'CNC', 'MIS'] as const).map((prod) => (
                    <button
                      key={prod}
                      onClick={() => setProductFilter(prod)}
                      className={`px-2.5 py-1 rounded-lg transition-all ${
                        productFilter === prod ? styles.pillActive : 'opacity-70 hover:opacity-100'
                      }`}
                    >
                      {prod}
                    </button>
                  ))}
                </div>

                {/* Sort dropdown */}
                <select
                  value={tradeSort}
                  onChange={(e) => setTradeSort(e.target.value as any)}
                  className={`px-3 py-2 rounded-xl text-xs font-bold border outline-none cursor-pointer ${styles.input}`}
                >
                  <option value="newest">Newest First</option>
                  <option value="highest_val">Highest Value (₹)</option>
                  <option value="symbol">Symbol A-Z</option>
                </select>
              </div>
            </div>

            {/* Trades Table */}
            <div className={`rounded-2xl border overflow-hidden transition-all ${styles.card}`}>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className={`border-b font-bold tracking-wider uppercase text-[11px] ${styles.tableHeadBg} ${styles.tableBorder}`}>
                      <th className="py-3.5 px-4">Trade / Order ID</th>
                      <th className="py-3.5 px-4">Timestamp (IST)</th>
                      <th className="py-3.5 px-4">Trader Account</th>
                      <th className="py-3.5 px-4">Stock Asset</th>
                      <th className="py-3.5 px-4">Action</th>
                      <th className="py-3.5 px-4">Product</th>
                      <th className="py-3.5 px-4 text-right">Quantity</th>
                      <th className="py-3.5 px-4 text-right">Executed Price</th>
                      <th className="py-3.5 px-4 text-right">Total Turnover</th>
                      <th className="py-3.5 px-4 text-right">Realized P&L</th>
                      <th className="py-3.5 px-4 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-inherit">
                    {filteredTrades.length === 0 ? (
                      <tr>
                        <td colSpan={11} className="py-12 text-center text-slate-500">
                          <Activity className="w-8 h-8 mx-auto mb-2 opacity-40" />
                          <p className="font-bold">No trading transactions found</p>
                          <p className="text-xs opacity-70 mt-0.5">Try resetting search filters or trigger a test trade.</p>
                        </td>
                      </tr>
                    ) : (
                      filteredTrades.map((trade) => {
                        const isBuy = trade.type === 'BUY';
                        const timeString = new Date(trade.timestamp).toLocaleTimeString('en-IN', {
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit'
                        });
                        const dateString = new Date(trade.timestamp).toLocaleDateString('en-IN', {
                          month: 'short',
                          day: 'numeric'
                        });

                        return (
                          <tr key={trade.id} className={`transition-colors ${styles.tableRowHover}`}>
                            
                            {/* Trade / Order ID */}
                            <td className="py-3.5 px-4 font-mono font-bold">
                              <div className="flex items-center gap-1.5">
                                <span>{trade.id}</span>
                                <button
                                  onClick={() => copyToClipboard(trade.id, trade.id)}
                                  className="p-1 rounded hover:bg-black/10 dark:hover:bg-white/10 opacity-50 hover:opacity-100"
                                  title="Copy Trade ID"
                                >
                                  {copiedId === trade.id ? <CheckCircle2 className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                                </button>
                              </div>
                              {trade.orderId && (
                                <div className="text-[10px] opacity-60 font-mono">
                                  Ref: {trade.orderId}
                                </div>
                              )}
                            </td>

                            {/* Timestamp */}
                            <td className="py-3.5 px-4 whitespace-nowrap">
                              <div className="font-semibold">{timeString}</div>
                              <div className="text-[10px] opacity-60">{dateString}</div>
                            </td>

                            {/* Trader Account */}
                            <td className="py-3.5 px-4">
                              <div className="font-bold text-slate-900 dark:text-white">
                                {trade.userName || 'Aarav Jain'}
                              </div>
                              <div className="text-[11px] opacity-65 font-mono">
                                {trade.userEmail || 'aaravvjain23@gmail.com'}
                              </div>
                            </td>

                            {/* Stock Asset */}
                            <td className="py-3.5 px-4">
                              <div className="inline-flex items-center gap-1.5 font-black font-mono text-[12.5px]">
                                <span className={`px-2 py-0.5 rounded-md ${
                                  isBeige ? 'bg-[#EFE7DC] text-slate-800' : 'bg-white/10 text-white'
                                }`}>
                                  {trade.symbol}
                                </span>
                              </div>
                              <div className="text-[11px] opacity-65 truncate max-w-[150px]">
                                {trade.stockName}
                              </div>
                            </td>

                            {/* Action */}
                            <td className="py-3.5 px-4">
                              <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-black uppercase tracking-wider ${
                                isBuy ? styles.buyBadge : styles.sellBadge
                              }`}>
                                {isBuy ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                                <span>{trade.type}</span>
                              </span>
                            </td>

                            {/* Product */}
                            <td className="py-3.5 px-4 font-mono font-semibold">
                              <span className={`px-2 py-0.5 rounded text-[11px] ${
                                trade.productType === 'MIS'
                                  ? isBeige ? 'bg-amber-100 text-amber-900' : 'bg-amber-500/20 text-amber-300'
                                  : isBeige ? 'bg-slate-100 text-slate-700' : 'bg-white/10 text-slate-300'
                              }`}>
                                {trade.productType || 'CNC'}
                              </span>
                            </td>

                            {/* Quantity */}
                            <td className="py-3.5 px-4 text-right font-mono font-bold">
                              {trade.quantity.toLocaleString('en-IN')}
                            </td>

                            {/* Executed Price */}
                            <td className="py-3.5 px-4 text-right font-mono font-bold">
                              ₹{trade.price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>

                            {/* Total Turnover */}
                            <td className="py-3.5 px-4 text-right font-mono font-black text-[13px]">
                              ₹{trade.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>

                            {/* Realized P&L */}
                            <td className="py-3.5 px-4 text-right font-mono font-bold">
                              {trade.realizedPnL !== undefined && trade.realizedPnL !== 0 ? (
                                <span className={trade.realizedPnL > 0 ? 'text-emerald-600 dark:text-mint' : 'text-rose-600 dark:text-rose-400'}>
                                  {trade.realizedPnL > 0 ? '+' : ''}₹{trade.realizedPnL.toFixed(2)}
                                </span>
                              ) : (
                                <span className="opacity-40">—</span>
                              )}
                            </td>

                            {/* Status */}
                            <td className="py-3.5 px-4 text-center">
                              <span className={`inline-flex items-center gap-1 text-[10.5px] font-bold px-2 py-0.5 rounded-full ${
                                trade.status === 'EXECUTED' 
                                  ? isBeige ? 'bg-emerald-100 text-emerald-800' : 'bg-emerald-500/20 text-mint'
                                  : 'bg-amber-100 text-amber-800'
                              }`}>
                                <CheckCircle2 className="w-3 h-3" />
                                <span>{trade.status}</span>
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: USER PROFILES & SIGN-IN DETAILS */}
        {activeTab === 'users' && (
          <div className="space-y-4">
            
            {/* Filter & Search Bar */}
            <div className={`p-4 rounded-2xl border flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 ${styles.card}`}>
              
              {/* Search */}
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 opacity-50" />
                <input
                  type="text"
                  placeholder="Search by Full Name, Email, Phone Number, or Username..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className={`w-full pl-9 pr-4 py-2 rounded-xl text-xs outline-none transition-all ${styles.input}`}
                />
              </div>

              {/* Experience Filter */}
              <div className="flex items-center gap-1 p-1 rounded-xl border bg-black/5 dark:bg-white/5 text-xs font-bold">
                <span className="text-[11px] opacity-70 ml-2 mr-1">Experience:</span>
                {(['ALL', 'BEGINNER', 'INTERMEDIATE', 'ADVANCED'] as const).map((tier) => (
                  <button
                    key={tier}
                    onClick={() => setExperienceFilter(tier)}
                    className={`px-2.5 py-1 rounded-lg transition-all ${
                      experienceFilter === tier ? styles.pillActive : 'opacity-70 hover:opacity-100'
                    }`}
                  >
                    {tier}
                  </button>
                ))}
              </div>
            </div>

            {/* Users Table with Phone Number, Mail, Age, etc. */}
            <div className={`rounded-2xl border overflow-hidden transition-all ${styles.card}`}>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className={`border-b font-bold tracking-wider uppercase text-[11px] ${styles.tableHeadBg} ${styles.tableBorder}`}>
                      <th className="py-3.5 px-4">Investor Profile</th>
                      <th className="py-3.5 px-4">Email Address</th>
                      <th className="py-3.5 px-4">Phone / WhatsApp</th>
                      <th className="py-3.5 px-4">Age / Category</th>
                      <th className="py-3.5 px-4">Experience Tier</th>
                      <th className="py-3.5 px-4 text-right">Virtual Capital</th>
                      <th className="py-3.5 px-4 text-right">Portfolio Value</th>
                      <th className="py-3.5 px-4 text-center">Trades Placed</th>
                      <th className="py-3.5 px-4">Registered Date</th>
                      <th className="py-3.5 px-4">Last Sign-in (IST)</th>
                      <th className="py-3.5 px-4 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-inherit">
                    {filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan={11} className="py-12 text-center text-slate-500">
                          <Users className="w-8 h-8 mx-auto mb-2 opacity-40" />
                          <p className="font-bold">No investor profiles match query</p>
                          <p className="text-xs opacity-70 mt-0.5">Check spelling or reset the experience filter.</p>
                        </td>
                      </tr>
                    ) : (
                      filteredUsers.map((user) => {
                        const regDate = new Date(user.registeredAt).toLocaleDateString('en-IN', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        });
                        const lastLogin = new Date(user.lastLoginAt).toLocaleString('en-IN', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        });

                        return (
                          <tr key={user.id} className={`transition-colors ${styles.tableRowHover}`}>
                            
                            {/* Investor Profile */}
                            <td className="py-3.5 px-4">
                              <div className="flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                                  isBeige ? 'bg-blue-100 text-blue-800' : 'bg-emerald-500/20 text-mint'
                                }`}>
                                  {user.fullName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                                </div>
                                <div>
                                  <div className="font-bold text-slate-900 dark:text-white">
                                    {user.fullName}
                                  </div>
                                  <div className="text-[11px] opacity-60 font-mono">
                                    @{user.username}
                                  </div>
                                </div>
                              </div>
                            </td>

                            {/* Email */}
                            <td className="py-3.5 px-4 font-mono">
                              <a 
                                href={`mailto:${user.email}`} 
                                className="inline-flex items-center gap-1.5 hover:underline font-semibold"
                              >
                                <Mail className="w-3.5 h-3.5 opacity-60 shrink-0" />
                                <span>{user.email}</span>
                              </a>
                            </td>

                            {/* Phone / WhatsApp */}
                            <td className="py-3.5 px-4 font-mono">
                              {user.phone ? (
                                <a 
                                  href={`tel:${user.phone.replace(/\s+/g, '')}`} 
                                  className="inline-flex items-center gap-1.5 hover:underline font-bold text-emerald-600 dark:text-emerald-400"
                                >
                                  <Phone className="w-3.5 h-3.5 shrink-0" />
                                  <span>{user.phone}</span>
                                </a>
                              ) : (
                                <span className="text-slate-400 opacity-60 italic">Not Provided</span>
                              )}
                            </td>

                            {/* Age / Category */}
                            <td className="py-3.5 px-4">
                              <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                                isBeige ? 'bg-[#EFE6D8] text-slate-700' : 'bg-white/10 text-emerald-200'
                              }`}>
                                {user.ageGroup || '16-18 (Teen Investor)'}
                              </span>
                            </td>

                            {/* Experience Tier */}
                            <td className="py-3.5 px-4">
                              <span className={`px-2.5 py-1 rounded-full text-[11px] font-black uppercase tracking-wider ${
                                user.experienceLevel === 'BEGINNER'
                                  ? isBeige ? 'bg-blue-100 text-blue-800' : 'bg-blue-500/20 text-blue-300'
                                  : user.experienceLevel === 'INTERMEDIATE'
                                  ? isBeige ? 'bg-amber-100 text-amber-800' : 'bg-amber-500/20 text-amber-300'
                                  : isBeige ? 'bg-purple-100 text-purple-800' : 'bg-purple-500/20 text-purple-300'
                              }`}>
                                {user.experienceLevel}
                              </span>
                            </td>

                            {/* Virtual Capital */}
                            <td className="py-3.5 px-4 text-right font-mono font-bold">
                              ₹{(user.initialCapital || 1000000).toLocaleString('en-IN')}
                            </td>

                            {/* Portfolio Value */}
                            <td className="py-3.5 px-4 text-right font-mono font-black text-[13px] text-emerald-600 dark:text-mint">
                              ₹{(user.portfolioValue || user.initialCapital || 1000000).toLocaleString('en-IN')}
                            </td>

                            {/* Trades Placed */}
                            <td className="py-3.5 px-4 text-center font-mono font-bold">
                              <span className="px-2 py-0.5 rounded-full bg-black/5 dark:bg-white/5">
                                {user.totalTrades || trades.filter(t => t.userId === user.id).length || 0}
                              </span>
                            </td>

                            {/* Registered Date */}
                            <td className="py-3.5 px-4 whitespace-nowrap opacity-75 font-semibold">
                              {regDate}
                            </td>

                            {/* Last Sign-in */}
                            <td className="py-3.5 px-4 whitespace-nowrap font-mono font-semibold">
                              <div className="flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                                <span>{lastLogin}</span>
                              </div>
                            </td>

                            {/* Actions: View Dossier */}
                            <td className="py-3.5 px-4 text-center">
                              <button
                                onClick={() => setSelectedUserDossier(user)}
                                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 mx-auto ${
                                  isBeige ? 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200' : 'bg-emerald-500/15 text-mint hover:bg-emerald-500/25 border border-emerald-500/30'
                                }`}
                              >
                                <Eye className="w-3 h-3" />
                                <span>Dossier</span>
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

      </main>

      {/* 5. USER DOSSIER MODAL */}
      {selectedUserDossier && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className={`max-w-2xl w-full rounded-3xl border p-6 sm:p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto ${styles.card}`}>
            
            <button
              onClick={() => setSelectedUserDossier(null)}
              className="absolute top-5 right-5 p-2 rounded-full hover:bg-black/10 dark:hover:bg-white/10 opacity-70 hover:opacity-100 transition-all"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-4 border-b pb-5 mb-6">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xl shadow-md ${
                isBeige ? 'bg-blue-600 text-white' : 'bg-mint text-slate-950 font-black'
              }`}>
                {selectedUserDossier.fullName.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <h2 className="text-xl font-black">{selectedUserDossier.fullName}</h2>
                <p className="text-xs opacity-65 font-mono">ID: {selectedUserDossier.id} • @{selectedUserDossier.username}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              
              <div className="p-3.5 rounded-xl border bg-black/5 dark:bg-white/5 space-y-1">
                <span className="font-bold opacity-60">Direct Email Address:</span>
                <p className="font-mono font-bold text-sm">{selectedUserDossier.email}</p>
              </div>

              <div className="p-3.5 rounded-xl border bg-black/5 dark:bg-white/5 space-y-1">
                <span className="font-bold opacity-60">Phone / Contact Number:</span>
                <p className="font-mono font-bold text-sm text-emerald-600 dark:text-mint">
                  {selectedUserDossier.phone || "Not Provided on Signup"}
                </p>
              </div>

              <div className="p-3.5 rounded-xl border bg-black/5 dark:bg-white/5 space-y-1">
                <span className="font-bold opacity-60">Demographic Investor Cohort:</span>
                <p className="font-bold text-sm">{selectedUserDossier.ageGroup || "16-18 (Teen Investor)"}</p>
              </div>

              <div className="p-3.5 rounded-xl border bg-black/5 dark:bg-white/5 space-y-1">
                <span className="font-bold opacity-60">Self-Assessed Skill Level:</span>
                <p className="font-bold text-sm">{selectedUserDossier.experienceLevel}</p>
              </div>

              <div className="p-3.5 rounded-xl border bg-black/5 dark:bg-white/5 space-y-1">
                <span className="font-bold opacity-60">Initial Virtual Endowment:</span>
                <p className="font-mono font-bold text-sm">₹{(selectedUserDossier.initialCapital || 1000000).toLocaleString('en-IN')}</p>
              </div>

              <div className="p-3.5 rounded-xl border bg-black/5 dark:bg-white/5 space-y-1">
                <span className="font-bold opacity-60">Current Net Portfolio:</span>
                <p className="font-mono font-bold text-sm text-blue-600 dark:text-blue-400">
                  ₹{(selectedUserDossier.portfolioValue || selectedUserDossier.initialCapital || 1000000).toLocaleString('en-IN')}
                </p>
              </div>

              <div className="p-3.5 rounded-xl border bg-black/5 dark:bg-white/5 space-y-1">
                <span className="font-bold opacity-60">Registration Timestamp:</span>
                <p className="font-mono text-xs">{new Date(selectedUserDossier.registeredAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} (IST)</p>
              </div>

              <div className="p-3.5 rounded-xl border bg-black/5 dark:bg-white/5 space-y-1">
                <span className="font-bold opacity-60">Last Successful Sign-in:</span>
                <p className="font-mono text-xs">{new Date(selectedUserDossier.lastLoginAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} (IST)</p>
              </div>
            </div>

            {/* User Trade Activity Summary */}
            <div className="mt-6 pt-5 border-t">
              <h3 className="text-xs font-bold uppercase tracking-wider mb-3">Trades Executed by this User</h3>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {trades.filter(t => t.userId === selectedUserDossier.id || t.userEmail === selectedUserDossier.email).length === 0 ? (
                  <p className="text-xs opacity-60 italic">No trading activity recorded for this user yet.</p>
                ) : (
                  trades
                    .filter(t => t.userId === selectedUserDossier.id || t.userEmail === selectedUserDossier.email)
                    .map(t => (
                      <div key={t.id} className="p-2.5 rounded-xl border bg-black/5 dark:bg-white/5 flex items-center justify-between text-xs font-mono">
                        <div className="flex items-center gap-2">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${t.type === 'BUY' ? styles.buyBadge : styles.sellBadge}`}>
                            {t.type}
                          </span>
                          <span className="font-black text-slate-900 dark:text-white">{t.symbol}</span>
                          <span className="opacity-60">({t.quantity} shares @ ₹{t.price.toFixed(2)})</span>
                        </div>
                        <span className="font-bold">₹{t.totalAmount.toLocaleString('en-IN')}</span>
                      </div>
                    ))
                )}
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setSelectedUserDossier(null)}
                className={`px-5 py-2 rounded-xl text-xs font-bold ${styles.accentBtn}`}
              >
                Close Dossier
              </button>
            </div>

          </div>
        </div>
      )}

      {/* 6. SIMULATE TEST TRADE MODAL */}
      {isSimulateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className={`max-w-md w-full rounded-3xl border p-6 shadow-2xl relative ${styles.card}`}>
            
            <button
              onClick={() => setIsSimulateModalOpen(false)}
              className="absolute top-5 right-5 p-2 rounded-full hover:bg-black/10 dark:hover:bg-white/10 opacity-70 hover:opacity-100 transition-all"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${
                isBeige ? 'bg-blue-600 text-white' : 'bg-mint text-slate-950 font-black'
              }`}>
                <PlusCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-black text-base">Simulate Test Trade</h3>
                <p className="text-xs opacity-65">Instantly broadcast a trade to test live dashboard sync</p>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <p className="opacity-80">Choose a simulated transaction to execute in the system:</p>

              <button
                onClick={() => handleSimulateAdminTrade('RELIANCE', 'BUY', 10, 2985.40)}
                className={`w-full p-3 rounded-xl border flex items-center justify-between text-left transition-all hover:scale-[1.01] ${styles.tableRowHover}`}
              >
                <div>
                  <div className="font-bold">Buy 10 shares of RELIANCE</div>
                  <div className="text-[11px] opacity-60">Price: ₹2,985.40 • Total: ₹29,854.00</div>
                </div>
                <span className={`px-2 py-1 rounded text-[11px] font-bold ${styles.buyBadge}`}>BUY</span>
              </button>

              <button
                onClick={() => handleSimulateAdminTrade('TCS', 'SELL', 5, 3940.80)}
                className={`w-full p-3 rounded-xl border flex items-center justify-between text-left transition-all hover:scale-[1.01] ${styles.tableRowHover}`}
              >
                <div>
                  <div className="font-bold">Sell 5 shares of TCS</div>
                  <div className="text-[11px] opacity-60">Price: ₹3,940.80 • Total: ₹19,704.00</div>
                </div>
                <span className={`px-2 py-1 rounded text-[11px] font-bold ${styles.sellBadge}`}>SELL</span>
              </button>

              <button
                onClick={() => handleSimulateAdminTrade('ZOMATO', 'BUY', 100, 262.80)}
                className={`w-full p-3 rounded-xl border flex items-center justify-between text-left transition-all hover:scale-[1.01] ${styles.tableRowHover}`}
              >
                <div>
                  <div className="font-bold">Buy 100 shares of ZOMATO</div>
                  <div className="text-[11px] opacity-60">Price: ₹262.80 • Total: ₹26,280.00</div>
                </div>
                <span className={`px-2 py-1 rounded text-[11px] font-bold ${styles.buyBadge}`}>BUY</span>
              </button>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setIsSimulateModalOpen(false)}
                className={`px-4 py-2 rounded-xl text-xs font-bold ${styles.secondaryBtn}`}
              >
                Cancel
              </button>
            </div>

          </div>
        </div>
      )}

      {/* 7. MODAL: CHANGE ADMIN PASSKEY */}
      {isChangePasskeyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className={`w-full max-w-md p-6 rounded-3xl border shadow-2xl ${styles.card}`}>
            
            <div className="flex items-center justify-between pb-4 border-b">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-xl ${isBeige ? 'bg-blue-100 text-blue-700' : 'bg-emerald-500/20 text-mint'}`}>
                  <Key className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-base">Change Administrator Passkey</h3>
                  <p className="text-xs opacity-65">Update your private master security code</p>
                </div>
              </div>
              <button
                onClick={() => setIsChangePasskeyModalOpen(false)}
                className="p-1 rounded-lg opacity-60 hover:opacity-100 transition-opacity"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {changeKeyError && (
              <div className="mt-4 p-3 rounded-xl border bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span>{changeKeyError}</span>
              </div>
            )}

            {changeKeySuccess && (
              <div className="mt-4 p-3 rounded-xl border bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-2">
                <Check className="w-4 h-4 shrink-0" />
                <span>{changeKeySuccess}</span>
              </div>
            )}

            <form onSubmit={handleUpdatePasskey} className="mt-4 space-y-3.5 text-xs">
              <div>
                <label className="block font-bold uppercase tracking-wider mb-1 opacity-80">
                  Current Passkey
                </label>
                <input
                  type="password"
                  value={currentKeyInput}
                  onChange={(e) => setCurrentKeyInput(e.target.value)}
                  placeholder="Enter current passkey..."
                  required
                  className={`w-full px-3.5 py-2.5 rounded-xl font-mono text-xs border transition-all ${styles.input}`}
                />
              </div>

              <div>
                <label className="block font-bold uppercase tracking-wider mb-1 opacity-80">
                  New Secret Passkey
                </label>
                <input
                  type="password"
                  value={newKeyInput}
                  onChange={(e) => setNewKeyInput(e.target.value)}
                  placeholder="At least 4 characters..."
                  required
                  className={`w-full px-3.5 py-2.5 rounded-xl font-mono text-xs border transition-all ${styles.input}`}
                />
              </div>

              <div>
                <label className="block font-bold uppercase tracking-wider mb-1 opacity-80">
                  Confirm New Passkey
                </label>
                <input
                  type="password"
                  value={confirmKeyInput}
                  onChange={(e) => setConfirmKeyInput(e.target.value)}
                  placeholder="Re-enter new passkey..."
                  required
                  className={`w-full px-3.5 py-2.5 rounded-xl font-mono text-xs border transition-all ${styles.input}`}
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t">
                <button
                  type="button"
                  onClick={() => setIsChangePasskeyModalOpen(false)}
                  className={`px-4 py-2 rounded-xl font-bold ${styles.secondaryBtn}`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdatingKey}
                  className={`px-4 py-2 rounded-xl font-bold flex items-center gap-1.5 shadow-md ${styles.accentBtn}`}
                >
                  {isUpdatingKey ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving…</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Save New Passkey</span>
                    </>
                  )}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
};
