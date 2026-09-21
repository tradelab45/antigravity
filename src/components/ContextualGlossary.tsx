import React, { useMemo, useState } from 'react';
import { BookMarked, Search, X } from 'lucide-react';
import type { AppTabType } from './Header';
import { useAccessibility } from '../context/AccessibilityContext';

const DEFINITIONS: Record<string, string> = {
  'P/E Ratio': 'Price divided by annual earnings per share. It helps compare what investors pay for each rupee of profit.',
  'Market Cap': 'The total market value of all a company’s shares. It indicates company size, not whether the stock is cheap.',
  '52-Week Range': 'The lowest and highest prices recorded over roughly the last year.',
  Volume: 'The number of shares traded during a period. High volume can indicate stronger participation.',
  'P&L': 'Profit and loss: the change between what an investment cost and what it is worth or was sold for.',
  Allocation: 'The percentage of your portfolio assigned to a stock, sector, or asset type.',
  Concentration: 'How much of the portfolio depends on one stock or sector. Higher concentration usually means higher risk.',
  Drawdown: 'The decline from a portfolio’s previous peak to a later low.',
  'Stop-Loss': 'A planned exit level intended to limit loss. It does not guarantee the exact execution price.',
  'R-Multiple': 'Trade outcome divided by the amount initially placed at risk. +2R means earning twice the planned risk.',
  'Win Rate': 'The percentage of closed trades that were profitable. It should be considered with average win and loss size.',
  XP: 'Learning points earned from unique lessons, reviews, missions, trades, and genuine milestones.',
  'Compound Interest': 'Growth earned on both the original amount and earlier gains over time.',
  Diversification: 'Spreading exposure across several companies or sectors so one outcome has less influence.',
  'Paper Trading': 'Practising investment decisions with virtual money instead of real capital.',
};

const HINDI_DEFINITIONS: Record<string, string> = {
  'P/E Ratio': 'शेयर की कीमत को कंपनी की प्रति-शेयर वार्षिक कमाई से विभाजित किया जाता है। इससे पता चलता है कि ₹1 लाभ के लिए बाज़ार कितना मूल्य दे रहा है।',
  'Market Cap': 'कंपनी के सभी shares का कुल बाज़ार मूल्य। यह कंपनी का आकार बताता है, यह नहीं कि stock सस्ता है या महँगा।',
  '52-Week Range': 'पिछले लगभग 1 वर्ष में दर्ज सबसे कम और सबसे अधिक कीमत।',
  Volume: 'किसी अवधि में trade हुए shares की संख्या। अधिक volume अधिक भागीदारी का संकेत हो सकता है।',
  'P&L': 'लाभ और हानि—निवेश की लागत और उसकी वर्तमान या बिक्री कीमत के बीच का अंतर।',
  Allocation: 'पोर्टफोलियो का वह प्रतिशत जो किसी stock, sector या asset type में लगाया गया है।',
  Concentration: 'पोर्टफोलियो किसी 1 stock या sector पर कितना निर्भर है। अधिक concentration का अर्थ सामान्यतः अधिक जोखिम है।',
  Drawdown: 'पोर्टफोलियो के पिछले उच्चतम स्तर से बाद के निम्न स्तर तक की गिरावट।',
  'Stop-Loss': 'पहले से तय exit level जो हानि सीमित करने में सहायता करता है। यह बिल्कुल उसी कीमत पर execution की गारंटी नहीं देता।',
  'R-Multiple': 'Trade के परिणाम को प्रारम्भिक नियोजित जोखिम से विभाजित किया जाता है। +2R का अर्थ नियोजित जोखिम का 2 गुना लाभ है।',
  'Win Rate': 'बन्द trades में लाभदायक trades का प्रतिशत। इसे औसत लाभ और हानि के आकार के साथ देखना चाहिए।',
  XP: 'विशिष्ट पाठ, समीक्षा, मिशन और वास्तविक उपलब्धियों से मिलने वाले learning points।',
  'Compound Interest': 'मूल राशि और पहले से मिले लाभ, दोनों पर समय के साथ वृद्धि मिलना।',
  Diversification: 'निवेश को कई कंपनियों और sectors में बाँटना, ताकि किसी 1 परिणाम का प्रभाव कम हो।',
  'Paper Trading': 'वास्तविक धन के बजाय virtual money से निवेश निर्णयों का अभ्यास करना।',
};

const CONTEXT_TERMS: Partial<Record<AppTabType, string[]>> = {
  home: ['XP', 'P&L', 'Diversification', 'Paper Trading'],
  screener: ['P/E Ratio', 'Market Cap', '52-Week Range', 'Volume'],
  watchlist: ['P/E Ratio', '52-Week Range', 'Volume'],
  portfolio: ['Allocation', 'Concentration', 'Drawdown', 'P&L', 'Diversification'],
  replay: ['Stop-Loss', 'R-Multiple', 'Drawdown'],
  review: ['R-Multiple', 'Win Rate', 'Stop-Loss', 'Drawdown'],
  journal: ['R-Multiple', 'Stop-Loss', 'Win Rate', 'Drawdown'],
  academy: ['Compound Interest', 'Diversification', 'Paper Trading', 'P/E Ratio'],
  calculator: ['Compound Interest', 'Allocation'],
  badges: ['XP', 'Win Rate', 'P&L'],
  challenges: ['Drawdown', 'Win Rate', 'R-Multiple'],
  chanakya: ['P/E Ratio', 'Market Cap', 'Diversification', 'Stop-Loss'],
};

export const ContextualGlossary: React.FC<{ activeTab: AppTabType }> = ({ activeTab }) => {
  const { settings } = useAccessibility();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const terms = useMemo(() => {
    const contextTerms = CONTEXT_TERMS[activeTab] || Object.keys(DEFINITIONS).slice(0, 5);
    const allTerms = Array.from(new Set([...contextTerms, ...Object.keys(DEFINITIONS)]));
    return allTerms.filter((term) => `${term} ${DEFINITIONS[term]} ${HINDI_DEFINITIONS[term] || ''}`.toLowerCase().includes(query.toLowerCase()));
  }, [activeTab, query]);
  const isHindi = settings.learningLanguage === 'HINDI';

  return (
    <>
      {/* Pinned to the left so it does not land on top of the quick-actions
          dock, which sits at the same height on the right. */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-[5.1rem] left-3 z-50 flex items-center gap-1.5 rounded-full border border-indigo-200 bg-white px-3 py-2 text-[11px] font-black text-indigo-800 shadow-lg dark:border-indigo-800 dark:bg-slate-900 dark:text-indigo-300 lg:hidden"
        aria-label="Open contextual investing glossary"
      >
        <BookMarked className="h-4 w-4" /> {isHindi ? 'शब्दावली' : 'Glossary'}
      </button>
      {open && (
        <div className="fixed inset-0 z-[90] lg:hidden" role="dialog" aria-modal="true" aria-label="Investing glossary">
          <button type="button" aria-label="Close glossary" onClick={() => setOpen(false)} className="absolute inset-0 bg-slate-950/55 backdrop-blur-sm" />
          <section className="absolute inset-x-0 bottom-0 max-h-[78vh] overflow-y-auto rounded-t-[28px] bg-white p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] shadow-2xl dark:bg-slate-900">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-black text-slate-950 dark:text-white">{isHindi ? 'सरल बाज़ार शब्दावली' : 'Glossary'}</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">{isHindi ? 'इस स्क्रीन से सम्बन्धित शब्द पहले दिखाई देंगे।' : 'Terms relevant to this screen appear first.'}</p>
              </div>
              <button type="button" onClick={() => setOpen(false)} aria-label="Close glossary" className="rounded-xl border border-slate-200 p-2 dark:border-slate-700"><X className="h-5 w-5" /></button>
            </div>
            <label className="relative mt-4 block">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={isHindi ? 'कोई शब्द खोजें' : 'Search a term'} className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-3 text-sm outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-800" />
            </label>
            <div className="mt-3 space-y-2">
              {terms.map((term, index) => (
                <details key={term} open={!query && index < 2} className="rounded-2xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800">
                  <summary className="cursor-pointer text-sm font-extrabold text-slate-900 dark:text-white">{term}</summary>
                  <p className="mt-2 text-xs leading-relaxed text-slate-600 dark:text-slate-300">{isHindi ? HINDI_DEFINITIONS[term] || DEFINITIONS[term] : DEFINITIONS[term]}</p>
                </details>
              ))}
            </div>
          </section>
        </div>
      )}
    </>
  );
};
