import React, { useEffect, useMemo, useState } from 'react';
import { Award, TrendingDown, TrendingUp, Wallet } from 'lucide-react';
import { UserAccount } from '../../../types';
import { formatINR } from '../../../utils/formatters';

/**
 * Personalised investor profile card for the header profile box.
 *
 * Adapted from the "ProfileCard" component by @dhileepkumargm on 21st.dev
 * (https://21st.dev/@dhileepkumargm/components/profile-card) — its tier glow,
 * cycling status line, glass panel and 3D tilt, re-typed and driven by the
 * signed-in user instead of the original's hard-coded sample data.
 *
 * The original uncovers its detail layer by sliding the identity panel up and
 * out of the card. That cannot work here: this renders inside the header's
 * `overflow-hidden` dropdown, so the panel was clipped and left an empty gap.
 * The reveal opens downwards instead, which stays within the dropdown.
 */

export interface ProfileCardProps {
  user: UserAccount | null;
  portfolioValue: number;
  totalPnLPercent: number;
  userXP: number;
  userLevel: number;
  levelTitle: string;
  levelMinXP: number;
  levelMaxXP: number;
  badgeCount: number;
}

/** Tiers are earned, so they are derived from level rather than stored. */
const TIERS = [
  { name: 'Bronze', min: 0, ring: 'ring-amber-600/60', glow: 'bg-amber-500', text: 'text-amber-300', shadow: 'rgba(245,158,11,0.55)' },
  { name: 'Silver', min: 3, ring: 'ring-slate-300/60', glow: 'bg-slate-300', text: 'text-slate-200', shadow: 'rgba(203,213,225,0.55)' },
  { name: 'Gold', min: 6, ring: 'ring-amber-400/70', glow: 'bg-amber-400', text: 'text-amber-300', shadow: 'rgba(251,191,36,0.6)' },
  { name: 'Platinum', min: 10, ring: 'ring-cyan-300/70', glow: 'bg-cyan-300', text: 'text-cyan-200', shadow: 'rgba(103,232,249,0.6)' },
] as const;

const resolveTier = (level: number) =>
  [...TIERS].reverse().find((tier) => level >= tier.min) || TIERS[0];

/**
 * Each investor gets their own avatar colours, kept stable by hashing the
 * username — the same person is the same colour on every device and reload.
 */
const AVATAR_GRADIENTS = [
  'from-indigo-500 to-violet-600',
  'from-emerald-500 to-teal-600',
  'from-rose-500 to-pink-600',
  'from-amber-500 to-orange-600',
  'from-sky-500 to-blue-600',
  'from-fuchsia-500 to-purple-600',
];

const hashString = (value: string): number => {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
};

const initialsOf = (fullName: string): string =>
  fullName
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('') || 'RR';

const EXPERIENCE_LABEL: Record<UserAccount['experienceLevel'], string> = {
  BEGINNER: 'ROOKIE',
  INTERMEDIATE: 'STRATEGIST',
  ADVANCED: 'MARKET PRO',
};

/** Cycles the status line, holding still for anyone who asked for less motion. */
const useCycledStatus = (statuses: string[], intervalMs: number): string => {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (statuses.length <= 1) return;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % statuses.length);
    }, intervalMs);
    return () => window.clearInterval(timer);
  }, [statuses, intervalMs]);

  return statuses[index % statuses.length] || '';
};

export const ProfileCard: React.FC<ProfileCardProps> = ({
  user,
  portfolioValue,
  totalPnLPercent,
  userXP,
  userLevel,
  levelTitle,
  levelMinXP,
  levelMaxXP,
  badgeCount,
}) => {
  const [revealed, setRevealed] = useState(false);

  const tier = resolveTier(userLevel);
  const displayName = user ? user.fullName : 'Guest Investor';
  const handle = user ? `@${user.username}` : 'Virtual practice account';
  const gradient = AVATAR_GRADIENTS[hashString(user?.username || 'guest') % AVATAR_GRADIENTS.length];

  const statuses = useMemo(() => {
    const entries = [
      user ? EXPERIENCE_LABEL[user.experienceLevel] : 'EXPLORING',
      `LVL ${userLevel} · ${levelTitle.toUpperCase()}`,
      `${userXP.toLocaleString('en-IN')} XP`,
    ];
    if (badgeCount > 0) entries.push(`${badgeCount} BADGE${badgeCount === 1 ? '' : 'S'}`);
    if (user?.totalTrades) entries.push(`${user.totalTrades} TRADES`);
    return entries;
  }, [user, userLevel, levelTitle, userXP, badgeCount]);

  const status = useCycledStatus(statuses, 2500);

  const memberSince = user
    ? new Date(user.registeredAt).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })
    : '—';

  const isUp = totalPnLPercent >= 0;
  const span = Math.max(1, levelMaxXP - levelMinXP);
  const progress = Math.min(100, Math.max(0, ((userXP - levelMinXP) / span) * 100));

  return (
    <div className="px-3 pt-3 pb-1" style={{ perspective: '900px' }}>
      <div
        className="relative w-full overflow-hidden rounded-2xl border border-slate-700 bg-slate-900/90 shadow-lg transition-transform duration-500 ease-out motion-reduce:transition-none"
        style={{
          transformStyle: 'preserve-3d',
          transform: revealed ? 'rotateX(-5deg) rotateY(3deg) scale(1.02)' : 'none',
        }}
        onMouseEnter={() => setRevealed(true)}
        onMouseLeave={() => setRevealed(false)}
        onFocus={() => setRevealed(true)}
        onBlur={() => setRevealed(false)}
        tabIndex={0}
        role="group"
        aria-label={`Investor profile for ${displayName}, ${tier.name} tier, level ${userLevel} ${levelTitle}`}
      >
        {/* Identity panel */}
        <div className="relative bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900">
          <div
            className={`absolute right-0 top-0 h-full w-1.5 ${tier.glow}`}
            style={{ boxShadow: `0 0 18px 2px ${tier.shadow}` }}
            aria-hidden="true"
          />
          <div className="flex items-center gap-3 px-3 py-2.5">
            <div
              className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${gradient} text-sm font-black text-white ring-2 ${tier.ring}`}
            >
              {user ? initialsOf(user.fullName) : 'RR'}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-xs font-extrabold text-white">{displayName}</div>
              <div className="truncate text-[10px] text-indigo-200">{handle}</div>
              <div className={`mt-1 truncate text-[10px] font-bold tracking-widest ${tier.text}`}>
                {tier.name.toUpperCase()} · <span className="text-white/80">{status}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Progress to the next level, opened by hover or keyboard focus */}
        <div
          className="overflow-hidden border-t border-white/10 bg-slate-900/80 transition-all duration-500 ease-in-out motion-reduce:transition-none"
          style={{ maxHeight: revealed ? 52 : 0, opacity: revealed ? 1 : 0 }}
        >
          <div className="px-3 py-2">
            <div className="flex items-center justify-between text-[9px] font-semibold text-slate-400">
              <span className="truncate">Level {userLevel} · {levelTitle}</span>
              <span className="font-mono">{userXP.toLocaleString('en-IN')} XP</span>
            </div>
            <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
              <div
                className={`h-full rounded-full ${tier.glow} transition-[width] duration-700 motion-reduce:transition-none`}
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>

        {/* Practice stats */}
        <div className="flex flex-col gap-2 bg-slate-900/90 p-3 text-white">
          <div className="grid grid-cols-2 gap-1.5">
            <div className="rounded-lg border border-white/10 bg-white/5 p-1.5">
              <div className="flex items-center gap-1 text-[9px] font-semibold text-slate-400">
                <Wallet className="h-2.5 w-2.5" /> Virtual capital
              </div>
              <div className="mt-0.5 font-mono text-[11px] font-bold text-amber-300">
                {formatINR(portfolioValue)}
              </div>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/5 p-1.5">
              <div className="flex items-center gap-1 text-[9px] font-semibold text-slate-400">
                {isUp ? <TrendingUp className="h-2.5 w-2.5" /> : <TrendingDown className="h-2.5 w-2.5" />} Overall P&amp;L
              </div>
              <div className={`mt-0.5 font-mono text-[11px] font-bold ${isUp ? 'text-emerald-400' : 'text-rose-400'}`}>
                {isUp ? '+' : ''}{totalPnLPercent.toFixed(2)}%
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between text-[9px] text-slate-400">
            <span className="flex items-center gap-1">
              <Award className="h-2.5 w-2.5" /> {badgeCount} badge{badgeCount === 1 ? '' : 's'}
            </span>
            <span>Practising since {memberSince}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileCard;
