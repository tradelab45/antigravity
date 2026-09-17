import React from 'react';
import { 
  ArrowUp, 
  ArrowUpRight, 
  ShieldCheck, 
  Sparkles, 
  Activity, 
  BookOpen, 
  Layers, 
  BarChart3, 
  Heart,
  ExternalLink
} from 'lucide-react';
import type { AppTabType } from './Header';

interface MotionFooterProps {
  onNavigate?: (tab: AppTabType) => void;
  onEnterAuth?: (mode: 'LOGIN' | 'SIGNUP') => void;
}

export const MotionFooter: React.FC<MotionFooterProps> = ({ onNavigate, onEnterAuth }) => {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="relative bg-[#050806] border-t border-white/10 text-slate-400 overflow-hidden pt-16 pb-12">
      {/* Background Animated Gradient Grid */}
      <div className="absolute inset-0 bg-[radial-gradient(#00f59b_1px,transparent_1px)] [background-size:24px_24px] opacity-[0.03] pointer-events-none" />
      
      {/* Top Ambient Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 max-w-4xl h-32 bg-[#00f59b]/5 blur-3xl rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-white/10">
          
          {/* Column 1 & 2: Brand & Mission */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-2.5">
              <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#00f59b] to-[#10b981] text-slate-950 flex items-center justify-center font-black text-lg shadow-[0_0_20px_rgba(0,245,155,0.4)]">
                ₹
              </span>
              <span className="text-xl font-black tracking-tight text-white">
                Rupee<span className="text-[#00f59b]">Rookie</span>
              </span>
            </div>

            <p className="text-sm text-slate-400 max-w-sm leading-relaxed">
              India's first 3D interactive learning simulator for high school and college investors. Build real financial intuition on Dalal Street without risking a single real rupee.
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#00f59b]/10 border border-[#00f59b]/30 text-[#00f59b] text-xs font-mono font-bold">
                <span className="w-2 h-2 rounded-full bg-[#00f59b] animate-pulse" />
                <span>NSE / DALAL STREET SIMULATOR</span>
              </div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-slate-300 text-xs font-mono">
                <span>₹10,00,000 VIRTUAL CASH</span>
              </div>
            </div>
          </div>

          {/* Column 3: Dalal Street Modules */}
          <div className="space-y-3">
            <h4 className="text-xs font-mono uppercase tracking-widest text-white font-bold">
              Trading Modules
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <button 
                  type="button"
                  onClick={() => onNavigate ? onNavigate('screener') : onEnterAuth && onEnterAuth('LOGIN')}
                  className="hover:text-[#00f59b] transition-colors flex items-center gap-1.5 cursor-pointer text-left"
                >
                  <BarChart3 className="w-3.5 h-3.5 text-[#00f59b]" />
                  <span>Market Screener (75+ Stocks)</span>
                </button>
              </li>
              <li>
                <button 
                  type="button"
                  onClick={() => onNavigate ? onNavigate('portfolio') : onEnterAuth && onEnterAuth('LOGIN')}
                  className="hover:text-[#00f59b] transition-colors flex items-center gap-1.5 cursor-pointer text-left"
                >
                  <Layers className="w-3.5 h-3.5 text-sky-400" />
                  <span>Portfolio & Risk Hub</span>
                </button>
              </li>
              <li>
                <button 
                  type="button"
                  onClick={() => onNavigate ? onNavigate('replay') : onEnterAuth && onEnterAuth('LOGIN')}
                  className="hover:text-[#00f59b] transition-colors flex items-center gap-1.5 cursor-pointer text-left"
                >
                  <Activity className="w-3.5 h-3.5 text-purple-400" />
                  <span>Historical Replay Lab</span>
                </button>
              </li>
              <li>
                <button 
                  type="button"
                  onClick={() => onNavigate ? onNavigate('watchlist') : onEnterAuth && onEnterAuth('LOGIN')}
                  className="hover:text-[#00f59b] transition-colors flex items-center gap-1.5 cursor-pointer text-left"
                >
                  <Heart className="w-3.5 h-3.5 text-rose-400" />
                  <span>Interactive Watchlist</span>
                </button>
              </li>
            </ul>
          </div>

          {/* Column 4: Learning Pathways */}
          <div className="space-y-3">
            <h4 className="text-xs font-mono uppercase tracking-widest text-white font-bold">
              Student Academy
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <button 
                  type="button"
                  onClick={() => onNavigate ? onNavigate('academy') : onEnterAuth && onEnterAuth('LOGIN')}
                  className="hover:text-[#00f59b] transition-colors flex items-center gap-1.5 cursor-pointer text-left"
                >
                  <BookOpen className="w-3.5 h-3.5 text-amber-400" />
                  <span>12 Foundation Lessons</span>
                </button>
              </li>
              <li>
                <button 
                  type="button"
                  onClick={() => onNavigate ? onNavigate('challenges') : onEnterAuth && onEnterAuth('LOGIN')}
                  className="hover:text-[#00f59b] transition-colors flex items-center gap-1.5 cursor-pointer text-left"
                >
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Trading Challenges & Badges</span>
                </button>
              </li>
              <li>
                <button 
                  type="button"
                  onClick={() => onNavigate ? onNavigate('badges') : onEnterAuth && onEnterAuth('LOGIN')}
                  className="hover:text-[#00f59b] transition-colors flex items-center gap-1.5 cursor-pointer text-left"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
                  <span>XP Ranks & Certifications</span>
                </button>
              </li>
              <li>
                <a 
                  href="https://www.sebi.gov.in" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="hover:text-[#00f59b] transition-colors flex items-center gap-1.5"
                >
                  <span>SEBI Investor Guidelines</span>
                  <ExternalLink className="w-3 h-3 text-slate-500" />
                </a>
              </li>
            </ul>
          </div>

          {/* Column 5: Instant Access */}
          <div className="space-y-3">
            <h4 className="text-xs font-mono uppercase tracking-widest text-white font-bold">
              Get Started
            </h4>
            <div className="space-y-2.5">
              <button
                type="button"
                onClick={() => onEnterAuth ? onEnterAuth('SIGNUP') : onNavigate && onNavigate('screener')}
                className="w-full py-2.5 px-3 bg-gradient-to-r from-[#00f59b] to-[#10b981] hover:brightness-110 text-slate-950 text-xs font-black rounded-xl transition-all shadow-[0_0_15px_rgba(0,245,155,0.25)] flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>Free Student Account</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={() => onEnterAuth ? onEnterAuth('LOGIN') : onNavigate && onNavigate('screener')}
                className="w-full py-2.5 px-3 bg-white/5 hover:bg-white/10 text-white border border-white/10 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>1-Click Demo Login</span>
              </button>
            </div>
          </div>

        </div>

        {/* Bottom Bar: Disclaimer & Copyright */}
        <div className="pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#00f59b] shrink-0" />
            <span>
              Purely educational simulator. Quotes are indicative and not SEBI-registered financial advice. All trades are virtual.
            </span>
          </div>

          <div className="flex items-center gap-4">
            <span>© 2026 RupeeRookie. Built for the next generation of Indian investors.</span>
            <button
              type="button"
              onClick={scrollToTop}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white border border-white/10 transition-colors cursor-pointer"
              title="Scroll to top"
              aria-label="Back to top"
            >
              <ArrowUp className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};
