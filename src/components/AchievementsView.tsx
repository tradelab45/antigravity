import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { 
  Award, 
  Sparkles, 
  Trophy, 
  CheckCircle2, 
  Lock, 
  Flame,
  GraduationCap,
  Building2,
  Globe2
} from 'lucide-react';
import { useSimulator } from '../context/SimulatorContext';
import { formatPercent } from '../utils/formatters';

type CohortType = 'TEEN' | 'COLLEGE' | 'OPEN';
type TimeframeType = 'DAILY' | 'WEEKLY' | 'ALL_TIME';

interface LeaderboardEntry {
  name: string;
  city: string;
  returnPct: number;
  xp: number;
  badge: string;
  school: string;
  score: number;
  isUser?: boolean;
}

const COHORT_PROFILES: Record<CohortType, Array<[string, string, string]>> = {
  TEEN: [
    ['Aanya', 'Bengaluru', 'Student Investor'],
    ['Kabir', 'Mumbai', 'School Finance Club'],
    ['Diya', 'Ahmedabad', 'Young Analyst'],
    ['Rohan', 'Pune', 'Student Investor'],
    ['Meher', 'Delhi', 'School Finance Club'],
  ],
  COLLEGE: [
    ['Sameer', 'Chennai', 'Campus Analyst'],
    ['Pooja', 'Hyderabad', 'Finance Society'],
    ['Nikhil', 'Kolkata', 'Campus Analyst'],
    ['Tanvi', 'Mumbai', 'Investment Club'],
    ['Arav', 'Pune', 'Finance Society'],
  ],
  OPEN: [
    ['Vikram', 'Gurugram', 'Practice Investor'],
    ['Meera', 'Kochi', 'Practice Investor'],
    ['Arjun', 'Jaipur', 'Market Learner'],
    ['Ishita', 'Indore', 'Market Learner'],
    ['Neel', 'Surat', 'Practice Investor'],
  ],
};

const hashSeed = (value: string) => Array.from(value).reduce((hash, char) => ((hash * 31) + char.charCodeAt(0)) >>> 0, 2166136261);
const seededValue = (seed: number, index: number) => {
  const x = Math.sin(seed + index * 997) * 10000;
  return x - Math.floor(x);
};

export const AchievementsView: React.FC = () => {
  const { 
    badges = [], 
    userXP = 0, 
    userLevel = { level: 1, title: 'Dalal Street Rookie 🌱', minXP: 0, maxXP: 300, nextLevelXp: 300 }, 
    totalPnLPercent = 0, 
    orders = [],
    holdings = {},
    currentUser,
    completedLessonIds = []
  } = useSimulator();

  const [selectedCohort, setSelectedCohort] = useState<CohortType>(() => {
    const ageGroup = currentUser?.ageGroup || '';
    return /13|14|15|16|17|18/.test(ageGroup) ? 'TEEN' : /19|20|21|college/i.test(ageGroup) ? 'COLLEGE' : 'OPEN';
  });
  const [selectedTimeframe, setSelectedTimeframe] = useState<TimeframeType>('WEEKLY');
  const [selectedBadgeCategory, setSelectedBadgeCategory] = useState<'ALL' | 'TRADING' | 'LEARNING' | 'PORTFOLIO' | 'WEALTH'>('ALL');

  const minXP = userLevel.minXP ?? 0;
  const maxXP = userLevel.maxXP ?? (userLevel.nextLevelXp || 300);

  const progressToNextLevel = useMemo(() => {
    const range = maxXP - minXP;
    if (range <= 0) return 100;
    const progress = ((userXP - minXP) / range) * 100;
    return Math.min(100, Math.max(0, progress));
  }, [userXP, minXP, maxXP]);

  const unlockedBadges = useMemo(() => {
    return badges.filter(b => b.unlocked);
  }, [badges]);

  const filteredBadges = useMemo(() => {
    if (selectedBadgeCategory === 'ALL') return badges;
    return badges.filter(b => b.category === selectedBadgeCategory);
  }, [badges, selectedBadgeCategory]);

  // Calculate user's trade statistics from orders safely
  const tradeStats = useMemo(() => {
    const executedOrders = orders.filter(o => o.status === 'EXECUTED');
    const totalOrders = executedOrders.length;
    const buyOrders = executedOrders.filter(o => o.type === 'BUY').length;
    const sellOrders = executedOrders.filter(o => o.type === 'SELL').length;
    const holdingsCount = Object.keys(holdings || {}).length;
    const closedTrades = executedOrders.filter(o => o.type === 'SELL' && typeof o.realizedPnL === 'number');
    const winningTrades = closedTrades.filter(o => (o.realizedPnL || 0) > 0);
    const winRate = closedTrades.length > 0 ? Math.round((winningTrades.length / closedTrades.length) * 100) : 0;

    return {
      totalTrades: totalOrders,
      buyCount: buyOrders,
      sellCount: sellOrders,
      winRate,
      holdingsCount,
      closedTrades: closedTrades.length
    };
  }, [orders, holdings, totalPnLPercent]);

  const userReturn = Number((Number(totalPnLPercent) || 0).toFixed(2));
  const userScore = Math.round(
    userXP +
    completedLessonIds.length * 35 +
    unlockedBadges.length * 50 +
    tradeStats.totalTrades * 30 +
    tradeStats.closedTrades * 25 +
    Math.max(-150, Math.min(300, userReturn * 20))
  );
  const rankingEligible = completedLessonIds.length >= 3 || tradeStats.closedTrades >= 5;

  const currentLeaderboard = useMemo(() => {
    const seed = hashSeed(`${currentUser?.id || 'guest'}:${selectedCohort}:${selectedTimeframe}`);
    const timeframeMultiplier = selectedTimeframe === 'DAILY' ? 0.35 : selectedTimeframe === 'WEEKLY' ? 0.7 : 1;
    const benchmarkEntries: LeaderboardEntry[] = COHORT_PROFILES[selectedCohort].map((profile, index) => {
      const activity = seededValue(seed, index + 1);
      const benchmarkXP = Math.round(180 + activity * 1450 * timeframeMultiplier);
      const benchmarkReturn = Number(((-2 + seededValue(seed, index + 20) * 13) * timeframeMultiplier).toFixed(2));
      return {
        name: `${profile[0]} · Benchmark ${index + 1}`,
        city: profile[1],
        school: profile[2],
        returnPct: benchmarkReturn,
        xp: benchmarkXP,
        badge: benchmarkXP >= 900 ? 'Advanced' : benchmarkXP >= 450 ? 'Explorer' : 'Rookie',
        score: Math.round(benchmarkXP + benchmarkReturn * 20 + seededValue(seed, index + 40) * 250),
      };
    });
    const userEntry: LeaderboardEntry = {
      name: currentUser?.fullName || 'Guest Investor',
      city: 'Your account',
      returnPct: userReturn,
      xp: userXP,
      score: userScore,
      isUser: true,
      badge: userLevel.title,
      school: `${tradeStats.totalTrades} trades · ${completedLessonIds.length} lessons`
    };

    return [...benchmarkEntries, userEntry]
      .sort((a, b) => b.score - a.score)
      .map((item, idx) => ({ ...item, currentRank: idx + 1 }));
  }, [completedLessonIds.length, currentUser?.fullName, currentUser?.id, selectedCohort, selectedTimeframe, tradeStats.totalTrades, userReturn, userScore, userXP, userLevel.title]);

  const userCurrentRank = currentLeaderboard.find(u => u.isUser)?.currentRank || currentLeaderboard.length;

  return (
    <div className="space-y-6">
      
      {/* Top Banner: User Level & XP Progression */}
      <div className="bg-gradient-to-r from-slate-900 via-[#2A3C52] to-slate-900 text-white rounded-3xl p-6 shadow-md border border-[#3A4C62]">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-indigo-600 p-1 shadow-md shrink-0 flex items-center justify-center">
              <div className="w-full h-full bg-slate-900 rounded-xl flex flex-col items-center justify-center font-black text-amber-300">
                <span className="text-[10px] text-zinc-300">LEVEL</span>
                <span className="text-2xl leading-none">{userLevel.level}</span>
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-xl font-black text-white">{userLevel.title}</h3>
                <span className="bg-amber-400/20 text-amber-300 text-xs font-black px-2.5 py-0.5 rounded-full border border-amber-400/30">
                  {rankingEligible ? `Rank #${userCurrentRank} in your ${selectedCohort} practice cohort` : 'Practice ranking locked · build genuine activity'}
                </span>
              </div>
              <p className="text-xs text-zinc-200 mt-1">
                Complete investor academy quizzes and execute disciplined trades to unlock new ranks & badges!
              </p>
            </div>
          </div>

          <div className="text-right w-full md:w-64">
            <div className="flex justify-between text-xs font-bold text-white mb-1.5">
              <span>XP Level Progress</span>
              <span className="text-amber-300 font-mono font-black">{userXP} / {maxXP} XP</span>
            </div>
            <div className="h-3 bg-zinc-900/80 rounded-full overflow-hidden border border-zinc-700/50">
              <div
                className="h-full bg-gradient-to-r from-amber-400 to-emerald-400 rounded-full transition-all duration-500"
                style={{ width: `${progressToNextLevel}%` }}
              />
            </div>
            <div className="text-[10px] text-zinc-300 mt-1 font-medium flex justify-between">
              <span>{Math.max(0, maxXP - userXP)} XP needed to advance</span>
              <span className="text-amber-300 font-bold">{progressToNextLevel.toFixed(0)}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Trader Stats Chips */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white border border-slate-200 p-3.5 rounded-2xl shadow-xs">
          <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">Your League Rank</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-xl font-black text-slate-900 font-mono">{rankingEligible ? `#${userCurrentRank}` : 'Locked'}</span>
            <span className="text-xs font-bold text-slate-500">{rankingEligible ? `of ${currentLeaderboard.length} practice profiles` : '3 lessons or 5 closed trades'}</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-3.5 rounded-2xl shadow-xs">
          <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">Win Rate</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-xl font-black text-slate-900 font-mono">{tradeStats.winRate}%</span>
            <span className="text-xs font-bold text-slate-500">{tradeStats.totalTrades} Trades</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-3.5 rounded-2xl shadow-xs">
          <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">Portfolio Return</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className={`text-xl font-black font-mono ${userReturn >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
              {userReturn >= 0 ? '+' : ''}{userReturn}%
            </span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-3.5 rounded-2xl shadow-xs">
          <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">Total Badges</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-xl font-black text-slate-900 font-mono">{unlockedBadges.length} / {badges.length}</span>
            <span className="text-xs font-bold text-indigo-600">Unlocked</span>
          </div>
        </div>
      </div>

      {/* 2-Column Grid: Badges Showcase & Leaderboard */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Badges Showcase (7 Cols) */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
            <div>
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <Award className="w-5 h-5 text-slate-900" />
                Investor Badges Showcase
              </h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Earn milestone badges by learning concepts & executing disciplined trades
              </p>
            </div>
            <span className="text-xs font-bold text-slate-900 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-xl self-start sm:self-auto">
              {unlockedBadges.length} / {badges.length} Unlocked
            </span>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs font-bold scrollbar-none">
            {(['ALL', 'TRADING', 'LEARNING', 'PORTFOLIO', 'WEALTH'] as const).map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedBadgeCategory(cat)}
                className={`px-3 py-1 rounded-xl transition-all whitespace-nowrap text-xs font-bold ${
                  selectedBadgeCategory === cat
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-50 text-slate-500 hover:text-slate-900 border border-slate-200'
                }`}
              >
                {cat === 'ALL' ? 'All Badges' : cat.charAt(0) + cat.slice(1).toLowerCase()}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            {filteredBadges.map((b) => {
              const isUnlocked = b.unlocked;

              return (
                <motion.div
                  key={b.id}
                  whileHover={{ scale: 1.01 }}
                  className={`p-3.5 rounded-2xl border flex items-start gap-3 transition-all ${
                    isUnlocked
                      ? 'bg-slate-50 border-slate-200 shadow-xs'
                      : 'bg-white border-slate-200 opacity-60'
                  }`}
                >
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0 border ${
                    isUnlocked
                      ? 'bg-indigo-600/20 border-indigo-600/40 text-indigo-600 shadow-xs'
                      : 'bg-slate-200 border-slate-200 dark:bg-slate-700 dark:border-slate-600 grayscale'
                  }`}>
                    {b.icon}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className={`text-xs font-black ${isUnlocked ? 'text-slate-900' : 'text-slate-500'}`}>
                        {b.title}
                      </h4>
                      {isUnlocked ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      ) : (
                        <Lock className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1 leading-snug font-medium">
                      {b.description}
                    </p>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="flex items-center gap-1 text-[10px] font-extrabold text-slate-900">
                        <Sparkles className="w-3 h-3 text-indigo-600" /> +{b.xpReward || 100} XP
                      </span>
                      {b.unlockedAt && (
                        <span className="text-[9px] text-slate-500 font-medium">
                          {b.unlockedAt}
                        </span>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Enhanced Teen & Student Leaderboard (5 Cols) */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-sm space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-slate-900" />
                  Dalal Street Arena Leaderboard
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Personalized practice benchmarks; your row uses real activity
                </p>
              </div>
              <Flame className="w-5 h-5 text-indigo-600" />
            </div>

            {/* Cohort Selector (Teen / College / Open) */}
            <div className="mt-4 grid grid-cols-3 gap-1.5 bg-slate-50 p-1 rounded-xl border border-slate-200">
              <button
                onClick={() => setSelectedCohort('TEEN')}
                className={`py-1.5 text-[11px] font-black rounded-lg transition-all flex items-center justify-center gap-1 ${
                  selectedCohort === 'TEEN'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <GraduationCap className="w-3 h-3" />
                <span>Teens (13-18)</span>
              </button>
              <button
                onClick={() => setSelectedCohort('COLLEGE')}
                className={`py-1.5 text-[11px] font-black rounded-lg transition-all flex items-center justify-center gap-1 ${
                  selectedCohort === 'COLLEGE'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <Building2 className="w-3 h-3" />
                <span>College</span>
              </button>
              <button
                onClick={() => setSelectedCohort('OPEN')}
                className={`py-1.5 text-[11px] font-black rounded-lg transition-all flex items-center justify-center gap-1 ${
                  selectedCohort === 'OPEN'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <Globe2 className="w-3 h-3" />
                <span>All-India</span>
              </button>
            </div>

            {/* Timeframe Filter (Daily / Weekly / All-Time) */}
            <div className="mt-2 flex items-center justify-end gap-1 text-[11px]">
              <button
                onClick={() => setSelectedTimeframe('DAILY')}
                className={`px-2.5 py-1 rounded-lg font-extrabold transition-all ${
                  selectedTimeframe === 'DAILY'
                    ? 'bg-amber-100 text-amber-900 border border-amber-300'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                24H Sprint
              </button>
              <button
                onClick={() => setSelectedTimeframe('WEEKLY')}
                className={`px-2.5 py-1 rounded-lg font-extrabold transition-all ${
                  selectedTimeframe === 'WEEKLY'
                    ? 'bg-amber-100 text-amber-900 border border-amber-300'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Weekly League
              </button>
              <button
                onClick={() => setSelectedTimeframe('ALL_TIME')}
                className={`px-2.5 py-1 rounded-lg font-extrabold transition-all ${
                  selectedTimeframe === 'ALL_TIME'
                    ? 'bg-amber-100 text-amber-900 border border-amber-300'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                All-Time Titans
              </button>
            </div>

            {/* Leaderboard Table List */}
            <div className="space-y-2 mt-3">
              {!rankingEligible ? (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
                  <Lock className="mx-auto h-7 w-7 text-slate-400" />
                  <p className="mt-2 text-sm font-black text-slate-800">Ranking needs genuine evidence</p>
                  <p className="mt-1 text-xs text-slate-500">Complete three Academy lessons or five closed simulated trades. Until then, no rank is assigned.</p>
                </div>
              ) : currentLeaderboard.map((user) => {
                const isUser = user.isUser;
                const isProfit = user.returnPct >= 0;

                return (
                  <div
                    key={user.name}
                    className={`p-3 rounded-2xl border flex items-center justify-between transition-all ${
                      isUser
                        ? 'bg-indigo-50/90 border-indigo-300 shadow-xs ring-1 ring-indigo-200'
                        : 'bg-white border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-7 h-7 rounded-xl flex items-center justify-center font-extrabold text-xs shrink-0 ${
                        user.currentRank === 1
                          ? 'bg-amber-400 text-amber-950 font-black shadow-xs'
                          : user.currentRank === 2
                          ? 'bg-slate-300 text-slate-900 font-bold'
                          : user.currentRank === 3
                          ? 'bg-amber-700 text-amber-100 font-bold'
                          : 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                      }`}>
                        {user.currentRank}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className={`text-xs font-black ${isUser ? 'text-indigo-950 font-black' : 'text-slate-900'}`}>
                            {user.name}
                          </span>
                          {isUser && (
                            <span className="text-[9px] bg-slate-900 text-white font-black px-1.5 py-0.5 rounded">
                              YOU
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-500 block font-medium">
                          {user.city} • {user.school}
                        </span>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-xs font-black font-mono text-indigo-700">
                        {user.score} pts
                      </div>
                      <div className={`text-[10px] font-bold ${isProfit ? 'text-emerald-700' : 'text-rose-700'}`}>
                        {formatPercent(user.returnPct)} · {user.xp} XP
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 text-xs text-slate-500 mt-4 font-medium">
            <strong>How scoring works:</strong> XP, completed lessons, unlocked badges, executed trades, closed-trade evidence, and capped portfolio return. Benchmark rows are simulated and vary by account and timeframe.
          </div>
        </div>

      </div>

    </div>
  );
};
