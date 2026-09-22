import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  CheckCircle2, 
  Sparkles, 
  TrendingUp, 
  Target, 
  Zap, 
  X,
  Layers,
  ArrowRight
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useSimulator } from '../context/SimulatorContext';

interface CompleteProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const TRADING_GOALS = [
  {
    id: 'WEALTH',
    title: 'Long-Term Wealth',
    desc: 'Focus on compounding, bluechips & index investing',
    icon: TrendingUp,
    color: '#00f59b'
  },
  {
    id: 'SWING',
    title: 'Swing & Momentum',
    desc: 'Master price action, technical breakouts & trend timing',
    icon: Zap,
    color: '#38bdf8'
  },
  {
    id: 'LITERACY',
    title: 'Market Literacy',
    desc: 'Understand how Indian businesses, NSE & markets tick',
    icon: Target,
    color: '#fbbf24'
  },
  {
    id: 'DERIVATIVES',
    title: 'Risk & Strategy',
    desc: 'Learn position sizing, portfolio hedging & market cycles',
    icon: Layers,
    color: '#c084fc'
  }
];

const SECTOR_OPTIONS = [
  { id: 'BANKING', name: 'Banking & Credit', ticker: 'HDFCBANK, ICICIBANK' },
  { id: 'TECH', name: 'Technology & Cloud', ticker: 'INFY, TCS, WIPRO' },
  { id: 'AUTO', name: 'Automotive & EV', ticker: 'TATAMOTORS, M&M' },
  { id: 'ENERGY', name: 'Energy & Power', ticker: 'RELIANCE, TATAPOWER' },
  { id: 'FMCG', name: 'FMCG & Consumer', ticker: 'ITC, HINDUNILVR' },
  { id: 'PHARMA', name: 'Pharma & Bio', ticker: 'SUNPHARMA, CIPLA' }
];

export const CompleteProfileModal: React.FC<CompleteProfileModalProps> = ({ isOpen, onClose }) => {
  const { currentUser } = useSimulator();

  const [selectedGoal, setSelectedGoal] = useState<string>('WEALTH');
  const [experience, setExperience] = useState<'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED'>(
    currentUser?.experienceLevel || 'BEGINNER'
  );
  const [riskTolerance, setRiskTolerance] = useState<'CONSERVATIVE' | 'BALANCED' | 'AGGRESSIVE'>('BALANCED');
  const [selectedSectors, setSelectedSectors] = useState<string[]>(['BANKING', 'TECH']);
  const [alias, setAlias] = useState<string>(currentUser?.username || '');
  const [bio, setBio] = useState<string>('Learner on Dalal Street looking to build strong market discipline.');
  const [isSaved, setIsSaved] = useState(false);

  if (!isOpen || !currentUser) return null;

  const toggleSector = (id: string) => {
    if (selectedSectors.includes(id)) {
      if (selectedSectors.length > 1) {
        setSelectedSectors(selectedSectors.filter(s => s !== id));
      }
    } else {
      if (selectedSectors.length < 3) {
        setSelectedSectors([...selectedSectors, id]);
      }
    }
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Save profile metadata to local storage
    const profileData = {
      goal: selectedGoal,
      experience,
      riskTolerance,
      sectors: selectedSectors,
      alias: alias.trim() || currentUser.username,
      bio: bio.trim(),
      completedAt: new Date().toISOString()
    };

    const completedKey = `rr_profile_completed_${currentUser.id}`;
    localStorage.setItem(completedKey, JSON.stringify(profileData));

    // Update active user in localStorage if alias or experience changed
    try {
      const userRaw = localStorage.getItem('rr_current_user');
      if (userRaw) {
        const userObj = JSON.parse(userRaw);
        userObj.experienceLevel = experience;
        if (alias.trim()) userObj.username = alias.trim();
        localStorage.setItem('rr_current_user', JSON.stringify(userObj));
      }
    } catch {
      // Ignored
    }

    // Trigger celebration confetti
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#00f59b', '#38bdf8', '#fbbf24', '#ffffff']
      });
    } catch {
      // Confetti fallback
    }

    setIsSaved(true);
    setTimeout(() => {
      onClose();
    }, 1600);
  };

  React.useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md overflow-hidden">
      <motion.div 
        initial={{ opacity: 0, scale: 0.94, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 15 }}
        transition={{ duration: 0.25 }}
        className="relative w-full max-w-2xl max-h-[92vh] overflow-y-auto overscroll-contain bg-[#0a110d] border border-white/15 rounded-3xl p-5 sm:p-7 shadow-[0_25px_60px_rgba(0,0,0,0.9)] text-slate-100 my-auto"
      >
        {/* Ambient Top Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-24 bg-mint/10 blur-3xl pointer-events-none rounded-full" />

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white border border-white/10 transition-all cursor-pointer"
          aria-label="Close profile modal"
        >
          <X className="w-4 h-4" />
        </button>

        {isSaved ? (
          <div className="py-12 text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-mint/20 border border-mint/40 text-mint flex items-center justify-center mx-auto shadow-[0_0_30px_rgba(0,245,155,0.3)]">
              <CheckCircle2 className="w-9 h-9" />
            </div>
            <h3 className="text-2xl font-black text-white">Profile 100% Completed!</h3>
            <p className="text-sm text-slate-300 max-w-md mx-auto">
              Your preferences have been calibrated. Chanakya AI and the market dashboard are now customized for your goals.
            </p>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-mint/15 border border-mint/30 text-mint font-mono text-xs font-bold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>+500 XP ONBOARDING BONUS CLAIMED</span>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSaveProfile} className="space-y-5">
            {/* Header */}
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-mint bg-mint/10 border border-mint/30 px-2.5 py-0.5 rounded-full">
                  STEP 2 OF 2 • ONBOARDING
                </span>
                <span className="text-[10px] font-mono text-amber-400 font-bold flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> +500 XP
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                Complete Your Trader Profile
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                Tell us your goals and risk comfort so Chanakya AI and Dalal Street simulator can adapt to you.
              </p>
            </div>

            {/* 1. Primary Goal Selection */}
            <div>
              <label className="block text-xs font-mono font-bold uppercase tracking-wider text-slate-300 mb-2">
                1. What is your primary learning goal?
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {TRADING_GOALS.map((goal) => {
                  const Icon = goal.icon;
                  const isSelected = selectedGoal === goal.id;
                  return (
                    <button
                      key={goal.id}
                      type="button"
                      onClick={() => setSelectedGoal(goal.id)}
                      className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex items-start gap-3 ${
                        isSelected
                          ? 'bg-mint/10 border-mint shadow-[0_0_15px_rgba(0,245,155,0.15)] ring-1 ring-mint'
                          : 'bg-white/5 border-white/10 hover:border-white/20 text-slate-300'
                      }`}
                    >
                      <div 
                        className="p-2 rounded-xl shrink-0"
                        style={{ background: isSelected ? 'rgba(0,245,155,0.2)' : 'rgba(255,255,255,0.06)', color: goal.color }}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-extrabold text-white">{goal.title}</div>
                        <div className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">{goal.desc}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. Experience & Risk Tolerance */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-mono font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                  2. Experience Level
                </label>
                <div className="grid grid-cols-3 gap-1.5 p-1 bg-black/40 border border-white/10 rounded-xl">
                  {(['BEGINNER', 'INTERMEDIATE', 'ADVANCED'] as const).map((lvl) => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => setExperience(lvl)}
                      className={`py-1.5 text-[10px] font-extrabold rounded-lg transition-all text-center cursor-pointer ${
                        experience === lvl
                          ? 'bg-mint text-slate-950 font-black shadow-xs'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {lvl === 'BEGINNER' ? 'Beginner' : lvl === 'INTERMEDIATE' ? 'Intermediate' : 'Advanced'}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                  3. Risk Appetite
                </label>
                <div className="grid grid-cols-3 gap-1.5 p-1 bg-black/40 border border-white/10 rounded-xl">
                  {(['CONSERVATIVE', 'BALANCED', 'AGGRESSIVE'] as const).map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setRiskTolerance(r)}
                      className={`py-1.5 text-[10px] font-extrabold rounded-lg transition-all text-center cursor-pointer ${
                        riskTolerance === r
                          ? 'bg-mint text-slate-950 font-black shadow-xs'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {r === 'CONSERVATIVE' ? 'Shielded' : r === 'BALANCED' ? 'Balanced' : 'High Growth'}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 3. Sectors of Interest */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-mono font-bold uppercase tracking-wider text-slate-300">
                  4. Sectors of Interest (Select up to 3)
                </label>
                <span className="text-[10px] font-mono text-mint">
                  {selectedSectors.length}/3 selected
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {SECTOR_OPTIONS.map((sec) => {
                  const isChecked = selectedSectors.includes(sec.id);
                  return (
                    <button
                      key={sec.id}
                      type="button"
                      onClick={() => toggleSector(sec.id)}
                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                        isChecked
                          ? 'bg-mint/12 border-mint/70 text-white'
                          : 'bg-white/5 border-white/10 hover:border-white/20 text-slate-400'
                      }`}
                    >
                      <div className="min-w-0 pr-1">
                        <div className="text-xs font-bold truncate text-white">{sec.name}</div>
                        <div className="text-[9.5px] text-slate-400 truncate">{sec.ticker}</div>
                      </div>
                      <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center shrink-0 ${
                        isChecked ? 'border-mint bg-mint text-slate-950' : 'border-white/20'
                      }`}>
                        {isChecked && <CheckCircle2 className="w-3.5 h-3.5" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 4. Trader Alias & Bio */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-xs font-mono font-bold uppercase tracking-wider text-slate-300 mb-1">
                  Trader Handle / Alias
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500 font-mono text-xs">@</span>
                  <input
                    type="text"
                    value={alias}
                    onChange={(e) => setAlias(e.target.value.replace(/[^a-zA-Z0-9_]/g, ''))}
                    placeholder="aarav_trader"
                    className="w-full pl-8 pr-3 py-2 bg-black/40 border border-white/15 focus:border-mint focus:ring-1 focus:ring-mint rounded-xl text-xs font-bold text-white placeholder-slate-500 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono font-bold uppercase tracking-wider text-slate-300 mb-1">
                  Trading Mission / Bio
                </label>
                <input
                  type="text"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="e.g. Learning price action and disciplined risk"
                  className="w-full px-3 py-2 bg-black/40 border border-white/15 focus:border-mint focus:ring-1 focus:ring-mint rounded-xl text-xs text-white placeholder-slate-500 transition-all"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex items-center gap-3">
              <button
                type="submit"
                className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-mint to-emerald-500 hover:brightness-110 active:scale-[0.99] text-slate-950 font-black text-xs sm:text-sm shadow-[0_0_20px_rgba(0,245,155,0.3)] transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <span>Save Profile & Enter Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={onClose}
                className="py-3 px-4 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white border border-white/10 text-xs font-bold transition-all cursor-pointer"
              >
                Skip for Now
              </button>
            </div>
          </form>
        )}
      </motion.div>
    </div>
  );
};
