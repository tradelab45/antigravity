import React, { useMemo, useState } from 'react';
import { 
  Trophy, 
  Users, 
  Calendar, 
  ShieldCheck, 
  Award, 
  GraduationCap, 
  Sparkles, 
  CheckCircle2, 
  ArrowRight,
  TrendingUp,
  Clock,
  Eye
} from 'lucide-react';
import { useSimulator } from '../context/SimulatorContext';
import { ChallengeItem } from '../types';
import { ClassBoard } from './ClassBoard';

export function TradingChallengesView() {
  const { notifyUser, currentUser, userXP, orders, totalPnLPercent, completedLessonIds } = useSimulator();
  const [activeTab, setActiveTab] = useState<'CHALLENGES' | 'LEADERBOARD' | 'SCHOOL'>('CHALLENGES');
  const registrationKey = `rr_challenge_registrations:${currentUser?.id || 'guest'}`;

  const [challenges, setChallenges] = useState<ChallengeItem[]>(() => {
    let registeredIds: string[] = [];
    try {
      registeredIds = JSON.parse(localStorage.getItem(registrationKey) || '[]');
    } catch {
      registeredIds = [];
    }
    return [
    {
      id: 'ch-monthly-10l',
      title: '₹10 Lakh Monthly RupeeRookie Championship',
      category: 'MONTHLY',
      initialCapital: 1000000,
      startDate: 'Open now',
      endDate: '30-day practice cycle',
      participantsCount: 25,
      status: 'ACTIVE',
      rules: [
        'Max 2% risk per single trade setup',
        'Mandatory Stop-Loss on all intraday positions',
        'Scoring formula: 70% Skill Score + 30% Net Alpha'
      ],
      maxLeverage: '5x Intraday',
      scoringBasis: 'Skill Score & Low Drawdown',
      prizes: 'Pro Trader Certification & Elite Hall of Fame Badge',
      userRegistered: registeredIds.includes('ch-monthly-10l')
    },
    {
      id: 'ch-nifty-intraday',
      title: 'NIFTY 50 Intraday Scalping League',
      category: 'INTRADAY',
      initialCapital: 100000,
      startDate: 'Weekly (Mon-Fri)',
      endDate: 'Continuous',
      participantsCount: 18,
      status: 'ACTIVE',
      rules: [
        'All positions must square off by 15:15 IST',
        'Maximum 6 trades per trading day',
        'Drawdown exceeding 5% triggers cool-down'
      ],
      maxLeverage: '5x MIS',
      scoringBasis: 'Profit Factor & Sharpe Ratio',
      prizes: 'Intraday Master Badge & 500 XP',
      userRegistered: registeredIds.includes('ch-nifty-intraday')
    },
    {
      id: 'ch-options-risk',
      title: 'Defined-Risk Options Spread Challenge',
      category: 'OPTIONS',
      initialCapital: 500000,
      startDate: 'Next practice cycle',
      endDate: 'Self-paced',
      participantsCount: 12,
      status: 'UPCOMING',
      rules: [
        'Naked short options strictly prohibited',
        'Only multi-leg spreads (Bull Call, Iron Condor, etc.)',
        'Risk-reward must be >= 1:1.5'
      ],
      maxLeverage: '1x Defined Risk',
      scoringBasis: 'Probability of Profit & Net Theta Efficiency',
      prizes: 'Options Architect Badge',
      userRegistered: registeredIds.includes('ch-options-risk')
    }
    ];
  });

  const leaderboard = useMemo(() => {
    const executed = orders.filter((order) => order.status === 'EXECUTED');
    const closed = executed.filter((order) => order.type === 'SELL' && typeof order.realizedPnL === 'number');
    const wins = closed.filter((order) => (order.realizedPnL || 0) > 0).length;
    const stopProtected = executed.filter((order) => order.bracketOrder?.stopLossPrice || order.bracketOrder?.stopLossPercent).length;
    const winRate = closed.length > 0 ? Math.round((wins / closed.length) * 100) : 0;
    const riskDiscipline = executed.length > 0 ? stopProtected / executed.length : 0;
    const userSkillScore = executed.length === 0
      ? Math.min(250, Math.round(userXP * 0.25 + completedLessonIds.length * 20))
      : Math.min(999, Math.round(userXP * 0.3 + executed.length * 35 + closed.length * 30 + winRate * 2 + riskDiscipline * 180 + Math.max(-80, Math.min(120, totalPnLPercent * 8))));
    const seedText = `${currentUser?.id || 'guest'}:${executed.length}:${completedLessonIds.length}`;
    const seed = Array.from(seedText).reduce((hash, char) => ((hash * 33) ^ char.charCodeAt(0)) >>> 0, 5381);
    const names = ['Aanya · Benchmark', 'Kabir · Benchmark', 'Meera · Benchmark', 'Rohan · Benchmark', 'Diya · Benchmark'];
    const peers = names.map((name, index) => {
      const random = Math.abs(Math.sin(seed + index * 193));
      const returnPct = Number((-2 + random * 14).toFixed(1));
      const skillScore = Math.round(260 + random * 650);
      return {
        name,
        skillScore,
        returnPct,
        maxDrawdown: Number((1 + (1 - random) * 6).toFixed(1)),
        winRate: Math.round(35 + random * 45),
        badge: skillScore >= 800 ? 'Platinum' : skillScore >= 650 ? 'Gold' : skillScore >= 450 ? 'Silver' : 'Rookie',
        isUser: false,
      };
    });
    const userRow = {
      name: currentUser?.fullName || 'Guest Investor',
      skillScore: userSkillScore,
      returnPct: Number(totalPnLPercent.toFixed(1)),
      maxDrawdown: Number(Math.max(0, -totalPnLPercent).toFixed(1)),
      winRate,
      badge: userSkillScore >= 800 ? 'Platinum' : userSkillScore >= 650 ? 'Gold' : userSkillScore >= 450 ? 'Silver' : userSkillScore >= 250 ? 'Bronze' : 'Rookie',
      isUser: true,
    };
    return [...peers, userRow]
      .sort((a, b) => b.skillScore - a.skillScore)
      .map((entry, index) => ({ ...entry, rank: index + 1 }));
  }, [completedLessonIds.length, currentUser?.fullName, currentUser?.id, orders, totalPnLPercent, userXP]);

  const handleToggleRegister = (challengeId: string) => {
    setChallenges((prev) =>
      {
        const next = prev.map((c) => {
        if (c.id === challengeId) {
          const updated = !c.userRegistered;
          notifyUser(
            updated ? 'Challenge Joined!' : 'Registration Cancelled',
            updated ? `You are registered for ${c.title}` : `Withdrawn from ${c.title}`,
            'SUCCESS'
          );
          return { ...c, userRegistered: updated };
        }
        return c;
        });
        localStorage.setItem(registrationKey, JSON.stringify(next.filter((challenge) => challenge.userRegistered).map((challenge) => challenge.id)));
        return next;
      }
    );
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 pb-12 animate-in fade-in duration-200">
      {/* A class sees itself here, next to the individual challenges. */}
      <ClassBoard />

      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl text-white relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-3 py-1 rounded-full text-xs font-black bg-amber-500/20 text-amber-300 border border-amber-400/30 uppercase tracking-wider flex items-center gap-1.5">
                <Trophy className="w-3.5 h-3.5 text-amber-400" />
                Skill-Based Competitions
              </span>
              <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
                Ranked by Discipline & Risk
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-3">
              <span>Practice Leagues & Challenges</span>
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Compare your genuine account activity with clearly labelled simulated practice profiles. This is not a live community competition.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('CHALLENGES')}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                activeTab === 'CHALLENGES' ? 'bg-indigo-600 text-white shadow-xs' : 'bg-slate-800 text-slate-400'
              }`}
            >
              Active Leagues
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('LEADERBOARD')}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                activeTab === 'LEADERBOARD' ? 'bg-indigo-600 text-white shadow-xs' : 'bg-slate-800 text-slate-400'
              }`}
            >
              Skill Leaderboard
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('SCHOOL')}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                activeTab === 'SCHOOL' ? 'bg-indigo-600 text-white shadow-xs' : 'bg-slate-800 text-slate-400'
              }`}
            >
              School & Educator Mode
            </button>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-indigo-200 bg-indigo-50 p-4 text-xs text-indigo-950">
        <strong>Simulation transparency:</strong> participant counts, peer rows, classrooms, and rankings on this screen are illustrative practice benchmarks. Only the row marked “You” uses your saved account activity.
      </div>

      {/* TAB 1: CHALLENGES LIST */}
      {activeTab === 'CHALLENGES' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {challenges.map((c) => (
            <div key={c.id} className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-lg text-white space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black px-2.5 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 uppercase">
                    {c.category}
                  </span>
                  <span className="text-xs font-mono text-slate-400 flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-slate-400" />
                    {c.participantsCount.toLocaleString()} simulated profiles
                  </span>
                </div>

                <h3 className="text-lg font-black text-white leading-tight">
                  {c.title}
                </h3>

                <div className="bg-slate-800/60 p-3 rounded-2xl border border-slate-700/60 text-xs space-y-1.5 font-mono">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Virtual Capital:</span>
                    <span className="text-white font-bold">₹{c.initialCapital.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Leverage:</span>
                    <span className="text-amber-300">{c.maxLeverage}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Ranking Metric:</span>
                    <span className="text-indigo-300">{c.scoringBasis}</span>
                  </div>
                </div>

                <div className="space-y-1 text-xs">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Rules & Constraints</span>
                  {c.rules.map((r, idx) => (
                    <div key={idx} className="flex items-start gap-1.5 text-slate-300 text-[11px]">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                      <span>{r}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => handleToggleRegister(c.id)}
                  className={`w-full py-3 rounded-2xl text-xs font-black transition-all cursor-pointer shadow-md ${
                    c.userRegistered
                      ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                      : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                  }`}
                >
                  {c.userRegistered ? 'REGISTERED ✓' : 'JOIN LEAGUE'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 2: SKILL LEADERBOARD */}
      {activeTab === 'LEADERBOARD' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-lg text-white space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <h3 className="text-sm font-black uppercase tracking-wider text-slate-300">
                Personalized Skill & Risk Practice Board
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Your row uses real account activity. Other rows are simulated benchmarks generated for this account.
              </p>
            </div>
            <span className="text-xs font-mono text-indigo-300 font-bold">Practice benchmark</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-slate-800/80 text-[10px] text-slate-400 font-bold uppercase border-b border-slate-700">
                  <th className="py-3 px-3 text-center">RANK</th>
                  <th className="py-3 px-3">TRADER</th>
                  <th className="py-3 px-3 text-center">TIER</th>
                  <th className="py-3 px-3 text-right">SKILL SCORE</th>
                  <th className="py-3 px-3 text-right">NET RETURN</th>
                  <th className="py-3 px-3 text-right">MAX DRAWDOWN</th>
                  <th className="py-3 px-3 text-right">WIN RATE</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 font-mono text-xs">
                {leaderboard.map((item) => (
                  <tr 
                    key={item.rank}
                    className={`hover:bg-slate-800/50 transition-colors ${
                      item.isUser ? 'bg-indigo-950/40 font-bold border-l-4 border-indigo-500' : ''
                    }`}
                  >
                    <td className="py-3 px-3 text-center font-black">
                      {item.rank === 1 ? '🥇 1' : item.rank === 2 ? '🥈 2' : item.rank === 3 ? '🥉 3' : item.rank}
                    </td>
                    <td className="py-3 px-3 font-sans font-extrabold text-white">
                      {item.name} {item.isUser && <span className="text-indigo-400 font-bold">(You)</span>}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-amber-300">
                        {item.badge}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right font-black text-amber-400">
                      {item.skillScore}
                    </td>
                    <td className="py-3 px-3 text-right text-emerald-400">
                      {item.returnPct >= 0 ? '+' : ''}{item.returnPct}%
                    </td>
                    <td className="py-3 px-3 text-right text-slate-300">
                      {item.maxDrawdown}%
                    </td>
                    <td className="py-3 px-3 text-right text-slate-300">
                      {item.winRate}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: SCHOOL & EDUCATOR MODE */}
      {activeTab === 'SCHOOL' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-lg text-white space-y-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                <GraduationCap className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider block">
                  Educator & Classroom Mode
                </span>
                <h3 className="text-xl font-black text-white">
                  Virtual Finance Classroom & Student League
                </h3>
              </div>
            </div>
            <div className="rounded-2xl border border-indigo-500/30 bg-indigo-500/10 px-4 py-2.5 text-left">
              <span className="flex items-center gap-2 text-xs font-black text-indigo-200"><Eye className="h-4 w-4" /> Classroom preview</span>
              <span className="mt-0.5 block text-[10px] text-slate-400">Creation and real enrolment are not connected yet.</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-800/50 p-4 rounded-2xl border border-slate-800 space-y-2">
                  <span className="text-xs font-black text-indigo-300">Demo class: Grade 10 FinTech Club</span>
              <p className="text-xs text-slate-300">32 Enrolled Students • ₹1,00,000 Custom Sandbox Capital</p>
              <div className="text-[11px] text-emerald-400 font-mono">Avg Skill Score: 780/1000</div>
            </div>
            <div className="bg-slate-800/50 p-4 rounded-2xl border border-slate-800 space-y-2">
                  <span className="text-xs font-black text-indigo-300">Demo class: University Investment League</span>
              <p className="text-xs text-slate-300">128 Enrolled Students • ₹10,00,000 Positional Portfolio</p>
              <div className="text-[11px] text-emerald-400 font-mono">Avg Skill Score: 840/1000</div>
            </div>
            <div className="bg-slate-800/50 p-4 rounded-2xl border border-slate-800 space-y-2 flex flex-col justify-center items-center text-center">
              <span className="text-xs text-slate-400">Assign curriculum quizzes, limit risk settings, and monitor class compliance.</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
