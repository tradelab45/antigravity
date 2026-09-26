import type { LearningLanguage } from '../context/AccessibilityContext';

/**
 * The app shell in English and Hindi.
 *
 * `learningLanguage` already switched the Academy summaries, the glossary and
 * the historical case studies, but the frame around them — the navigation, the
 * header, the display menu — stayed English, so a learner who chose Hindi still
 * had to read English to find their way about.
 *
 * English is the source of truth: a missing Hindi entry falls back to it rather
 * than showing a key, so a half-finished translation degrades quietly.
 *
 * Financial nouns that Indian speakers use in English stay in English —
 * "portfolio", "market", "P&L" — because transliterating them reads as
 * stiffer, not clearer. This mirrors how the Academy copy is already written.
 */
export const UI_STRINGS = {
  'nav.home': { en: 'Home', hi: 'होम' },
  'nav.markets': { en: 'Markets', hi: 'मार्केट' },
  'nav.portfolio': { en: 'Portfolio', hi: 'पोर्टफोलियो' },
  'nav.traderDna': { en: 'Trader DNA', hi: 'ट्रेडर DNA' },
  'nav.learn': { en: 'Learn', hi: 'सीखें' },
  'nav.aiCoach': { en: 'AI Coach', hi: 'AI कोच' },
  'nav.labs': { en: 'Labs', hi: 'लैब्स' },
  'nav.journal': { en: 'Journal', hi: 'जर्नल' },

  'labs.replay': { en: 'Replay OS', hi: 'रीप्ले OS' },
  'labs.graph': { en: 'BigQuery Graph Lab', hi: 'BigQuery ग्राफ़ लैब' },
  'labs.calculator': { en: 'Compound Calculator', hi: 'कंपाउंड कैलकुलेटर' },
  'labs.progress': { en: 'Progress & Badges', hi: 'प्रगति और बैज' },

  'header.help': { en: 'Help', hi: 'मदद' },
  'header.display': { en: 'Display', hi: 'डिस्प्ले' },
  'header.search': { en: 'Search shares…', hi: 'शेयर खोजें…' },
  'header.portfolioValue': { en: 'Portfolio value', hi: 'पोर्टफोलियो वैल्यू' },
  'header.availableCash': { en: 'Available cash', hi: 'उपलब्ध कैश' },
  'header.totalPnl': { en: 'Total P&L', hi: 'कुल P&L' },
  'header.simulation': { en: 'Simulation', hi: 'सिमुलेशन' },
  'header.tagline': { en: 'Train like it’s real. Risk nothing.', hi: 'असली जैसा अभ्यास। जोखिम शून्य।' },

  'display.mode': { en: 'Mode', hi: 'मोड' },
  'display.light': { en: 'Light', hi: 'लाइट' },
  'display.dark': { en: 'Dark', hi: 'डार्क' },
  'display.density': { en: 'Density', hi: 'घनत्व' },
  'display.comfortable': { en: 'Comfortable', hi: 'आरामदायक' },
  'display.compact': { en: 'Compact', hi: 'सघन' },
  'display.background': { en: 'Background colour', hi: 'बैकग्राउंड रंग' },
  'display.more': { en: 'More display settings', hi: 'और डिस्प्ले सेटिंग्स' },

  'action.buy': { en: 'Buy', hi: 'खरीदें' },
  'action.sell': { en: 'Sell', hi: 'बेचें' },
  'action.cancel': { en: 'Cancel', hi: 'रद्द करें' },
  'action.confirm': { en: 'Confirm', hi: 'पुष्टि करें' },
  'action.undo': { en: 'Undo', hi: 'वापस लें' },
  'action.close': { en: 'Close', hi: 'बंद करें' },
  'action.save': { en: 'Save', hi: 'सेव करें' },
  'action.signOut': { en: 'Sign out', hi: 'साइन आउट' },
  'action.reset': { en: 'Reset portfolio', hi: 'पोर्टफोलियो रीसेट करें' },
} as const;

export type UiStringKey = keyof typeof UI_STRINGS;

/**
 * Looks a string up in the chosen language.
 *
 * An unknown key returns the key itself rather than an empty string, so a typo
 * shows up on screen during development instead of leaving a blank label.
 */
export function translate(key: UiStringKey, language: LearningLanguage): string {
  const entry = UI_STRINGS[key];
  if (!entry) return key;
  if (language === 'HINDI' && entry.hi) return entry.hi;
  return entry.en;
}
