import React, { useState } from 'react';
import { Award, Trophy } from 'lucide-react';
import { AchievementsView } from './AchievementsView';
import { TradingChallengesView } from '../../../components/TradingChallengesView';

interface ProgressHubProps {
  initialSection?: 'challenges' | 'achievements';
}

export const ProgressHub: React.FC<ProgressHubProps> = ({ initialSection = 'challenges' }) => {
  const [activeSection, setActiveSection] = useState<'challenges' | 'achievements'>(initialSection);

  return (
    <div className="rr-surfaces space-y-6">
      <nav
        aria-label="Progress sections"
        className="grid w-full grid-cols-2 gap-2 rounded-2xl border border-slate-200 bg-white p-1.5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:max-w-[460px]"
      >
        <button
          type="button"
          onClick={() => setActiveSection('challenges')}
          aria-current={activeSection === 'challenges' ? 'page' : undefined}
          className={`flex min-h-11 items-center justify-center gap-2 rounded-xl px-3 text-xs font-black transition-colors ${
            activeSection === 'challenges'
              ? 'bg-slate-900 text-white shadow-sm dark:bg-indigo-600'
              : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
          }`}
        >
          <Trophy className="h-4 w-4 shrink-0" />
          Challenges
        </button>
        <button
          type="button"
          onClick={() => setActiveSection('achievements')}
          aria-current={activeSection === 'achievements' ? 'page' : undefined}
          className={`flex min-h-11 items-center justify-center gap-2 rounded-xl px-3 text-xs font-black transition-colors ${
            activeSection === 'achievements'
              ? 'bg-slate-900 text-white shadow-sm dark:bg-indigo-600'
              : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
          }`}
        >
          <Award className="h-4 w-4 shrink-0" />
          Achievements
        </button>
      </nav>

      {activeSection === 'challenges' ? <TradingChallengesView /> : <AchievementsView />}
    </div>
  );
};
