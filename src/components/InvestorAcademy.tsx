import React, { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BookOpen, 
  CheckCircle2, 
  Sparkles, 
  HelpCircle, 
  Calculator, 
  TrendingUp, 
  Zap, 
  ShieldCheck, 
  ArrowRight, 
  Layers, 
  Award,
  ChevronRight,
  RotateCcw,
  Search,
  X,
  Filter,
  Bookmark,
  Volume2,
  VolumeX,
  Lock,
  Swords
} from 'lucide-react';
import { INITIAL_LESSONS } from '../data/lessonsData';
import { CASE_STUDIES_DATA, CaseStudy } from '../data/caseStudiesData';
import { useSimulator } from '../context/SimulatorContext';
import { Lesson, LessonQuizOption } from '../types';
import { formatINR } from '../utils/formatters';
import { HistoricalEventsLab } from './HistoricalEventsLab';
import { PortfolioConstructionLab } from './PortfolioConstructionLab';
import { TaxCentre } from '../modules/tax/components/TaxCentre';
import { startPracticeTask } from './PracticeTaskBanner';
import { getPracticeAction } from '../data/practiceActions';
import { StageExam } from './StageExam';
import {
  getStageExam,
  EXAM_LENGTH,
  EXAM_PASS_MARK,
  EXAM_ATTEMPT_HISTORY,
  emptyExamMemory,
  memoryFromSeenIds,
  recordPaper,
  type ExamAttempt,
  type ExamMemory,
  type QuestionResult,
} from '../data/stageExams';
import { SectionSkipLinks } from './ui/section-skip-links';
import type { AppTabType } from './Header';
import { useAccessibility } from '../modules/accessibility/context/AccessibilityContext';

import { localizeLesson } from '../data/hindiLessons';
import { readResume } from '../utils/academyProgress';
import { useExamHistory } from '../hooks/useExamHistory';
import { ExamHistory } from './ExamHistory';
import { CohortLeaderboard } from './CohortLeaderboard';

import { LEARNING_PATH, getStageForLesson, type LearningStageId } from '../data/learningPath';

type AcademyTabId =
  | 'LESSONS'
  | 'STAGE_EXAM'
  | 'CASE_STUDIES'
  | 'TAX_CENTRE'
  | 'PORTFOLIO_MODELS'
  | 'HISTORICAL_EVENTS'
  | 'DAILY_QUIZ'
  | 'BATTLE'
  | 'JARGON_BUSTER'
  | 'HISTORY'
  | 'LEADERBOARD';

const ACADEMY_TAB_HINDI: Record<AcademyTabId, string> = { LESSONS: 'पाठ', STAGE_EXAM: 'चरण परीक्षा', CASE_STUDIES: 'उदाहरण अध्ययन', TAX_CENTRE: 'कर केंद्र', PORTFOLIO_MODELS: 'पोर्टफोलियो मॉडल', HISTORICAL_EVENTS: 'बाज़ार इतिहास', DAILY_QUIZ: 'दैनिक प्रश्न', BATTLE: '1v1 मुकाबला', JARGON_BUSTER: 'शब्दावली', HISTORY: 'परीक्षा इतिहास', LEADERBOARD: 'स्कूल / कॉलेज रैंकिंग' };

const ACADEMY_TABS: Array<{ id: AcademyTabId; icon: string; label: string; count?: number }> = [
  { id: 'LESSONS', icon: '📚', label: 'Lessons', count: INITIAL_LESSONS.length },
  { id: 'HISTORY', icon: '', label: 'Exam History' },
  { id: 'LEADERBOARD', icon: '', label: 'School / College' },
  { id: 'STAGE_EXAM', icon: '📝', label: 'Stage Exam', count: EXAM_LENGTH },
  { id: 'CASE_STUDIES', icon: '📊', label: 'Case Studies', count: CASE_STUDIES_DATA.length },
  { id: 'TAX_CENTRE', icon: '🧾', label: 'Tax Centre' },
  { id: 'PORTFOLIO_MODELS', icon: '🧭', label: 'Portfolio Models' },
  { id: 'HISTORICAL_EVENTS', icon: '🕰️', label: 'Market History' },
  { id: 'DAILY_QUIZ', icon: '🎯', label: 'Investor Quiz' },
  { id: 'BATTLE', icon: '⚔️', label: '1v1 Battle' },
  { id: 'JARGON_BUSTER', icon: '📖', label: 'Jargon Glossary' },
];

// Helper to format text with bold, italics, formulas, and structured lists
function FormattedLessonContent({ content }: { content: string }) {
  const paragraphs = content.split('\n\n');

  return (
    <div className="space-y-4">
      {paragraphs.map((p, idx) => {
        const trimmed = p.trim();
        if (!trimmed) return null;

        // Formula block $$ ... $$
        if (trimmed.startsWith('$$') && trimmed.endsWith('$$')) {
          const formula = trimmed.slice(2, -2).trim()
            .replace(/\\text\{([^}]+)\}/g, '$1')
            .replace(/\\times/g, ' × ')
            .replace(/\\div/g, ' ÷ ')
            .replace(/\\approx/g, ' ≈ ')
            .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '($1) / ($2)')
            .replace(/\\%/g, '%');

          return (
            <div
              key={idx}
              className="my-3 py-3 px-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-center text-center shadow-xs"
            >
              <div className="font-mono text-xs sm:text-sm font-bold text-slate-900 tracking-wide">
                📐 {formula}
              </div>
            </div>
          );
        }

        // A block can mix a lead-in sentence with bullet or numbered lines.
        // Splitting it into runs keeps the bullets on their own rows instead of
        // collapsing the whole block into one paragraph.
        const lines = trimmed.split('\n');
        const isBullet = (line: string) => line.trim().startsWith('- ') || /^\d+\.\s/.test(line.trim());

        const runs: Array<{ type: 'text' | 'list'; lines: string[] }> = [];
        lines.forEach((line) => {
          if (!line.trim()) return;
          const type = isBullet(line) ? 'list' : 'text';
          const previous = runs[runs.length - 1];
          if (previous && previous.type === type) previous.lines.push(line);
          else runs.push({ type, lines: [line] });
        });

        return (
          <div key={idx} className="space-y-3">
            {runs.map((run, runIdx) => run.type === 'list' ? (
              <ul key={runIdx} className="space-y-2 my-2">
                {run.lines.map((line, lIdx) => {
                  const isOrdered = /^\d+\.\s/.test(line.trim());
                  const cleanText = line.trim().replace(/^(?:-|\d+\.)\s+/, '');
                  return (
                    <li key={lIdx} className="flex items-start gap-2.5 text-sm sm:text-base text-slate-900 dark:text-slate-200">
                      <span className="mt-0.5 w-4 h-4 rounded-full bg-slate-200 text-slate-900 dark:bg-slate-700 dark:text-slate-100 text-[10px] font-black flex items-center justify-center shrink-0">
                        {isOrdered ? lIdx + 1 : '•'}
                      </span>
                      <span className="flex-1 leading-relaxed">
                        {renderInlineFormatting(cleanText)}
                      </span>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p key={runIdx} className="text-sm sm:text-base text-slate-900 dark:text-slate-200 leading-7">
                {renderInlineFormatting(run.lines.join(' '))}
              </p>
            ))}
          </div>
        );
      })}
    </div>
  );
}

function renderInlineFormatting(text: string) {
  const parts = text.split(/(\$\$[^$]+\$\$|\*\*[^*]+\*\*|\*[^*]+\*)/g);
  return parts.map((part, index) => {
    if (part.startsWith('$$') && part.endsWith('$$')) {
      const formula = part.slice(2, -2).trim()
        .replace(/\\text\{([^}]+)\}/g, '$1')
        .replace(/\\times/g, ' × ')
        .replace(/\\div/g, ' ÷ ')
        .replace(/\\approx/g, ' ≈ ')
        .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '($1) / ($2)')
        .replace(/\\%/g, '%');
      return (
        <span key={index} className="inline-block px-2 py-0.5 mx-1 bg-slate-50 text-slate-900 font-mono font-bold text-xs rounded-md border border-slate-200">
          {formula}
        </span>
      );
    }
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={index} className="font-extrabold text-slate-900">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith('*') && part.endsWith('*')) {
      return (
        <em key={index} className="italic text-indigo-600 font-semibold">
          {part.slice(1, -1)}
        </em>
      );
    }
    return part;
  });
}

interface InvestorAcademyProps {
  /** Lets a finished lesson send the learner to the view its task belongs in. */
  setActiveTab?: (tab: AppTabType) => void;
}

export const InvestorAcademy: React.FC<InvestorAcademyProps> = ({ setActiveTab }) => {
  const { completedLessonIds, completeLesson, currentUser } = useSimulator();
  const { settings, updateSetting } = useAccessibility();
  const hindi = settings.learningLanguage === 'HINDI';
  const { attempts, recordAttempt, notice, sync } = useExamHistory(currentUser?.id);
  const localizedLessons = useMemo(() => INITIAL_LESSONS.map(lesson => localizeLesson(lesson, settings.learningLanguage)), [settings.learningLanguage]);
  const resume = readResume(currentUser?.id, new URLSearchParams(window.location.search).get('lesson'));

  const academyKey = `rr_academy_workspace:${currentUser?.id || 'guest'}`;
  const recommendedLessonIndex = currentUser?.experienceLevel === 'ADVANCED' ? 8 : currentUser?.experienceLevel === 'INTERMEDIATE' ? 4 : 0;
  const recommendedLesson = INITIAL_LESSONS[Math.min(recommendedLessonIndex, INITIAL_LESSONS.length - 1)];
  const [activeLessonId, setActiveLessonId] = useState<string>(() => resume?.lessonId || INITIAL_LESSONS[0].id);
  const [selectedQuizOption, setSelectedQuizOption] = useState<LessonQuizOption | null>(null);
  const [isQuizSubmitted, setIsQuizSubmitted] = useState<boolean>(false);
  const [activeSubTab, setActiveSubTab] = useState<AcademyTabId>('LESSONS');
  // Which learning stage the person is currently working through. Only this
  // stage's modules are listed, which keeps the lesson list short and readable.
  const [activeStageId, setActiveStageId] = useState<LearningStageId>(() => resume?.stage.id || LEARNING_PATH[0].id);
  
  // Case Studies State
  const [activeCaseStudyId, setActiveCaseStudyId] = useState<string>(CASE_STUDIES_DATA[0].id);
  const [caseStudyCategory, setCaseStudyCategory] = useState<string>('ALL');

  // Jargon search
  const [jargonQuery, setJargonQuery] = useState<string>('');
  const [lessonQuery, setLessonQuery] = useState('');
  const [bookmarkedLessonIds, setBookmarkedLessonIds] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem(`${academyKey}:bookmarks`) || '[]'); } catch { return []; }
  });
  const [isReadingAloud, setIsReadingAloud] = useState(false);

  useEffect(() => () => window.speechSynthesis?.cancel(), []);

  const toggleReadAloud = () => {
    if (!('speechSynthesis' in window)) return;
    if (isReadingAloud) {
      window.speechSynthesis.cancel();
      setIsReadingAloud(false);
      return;
    }
    const text = `${activeLesson.title}. ${activeLesson.summary}. ${activeLesson.sections.map(section => section.content).join('. ')}. ${activeLesson.keyTakeaways.join('. ')}`;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = settings.learningLanguage === 'HINDI' ? 'hi-IN' : 'en-IN';
    utterance.rate = 0.92;
    utterance.onend = () => setIsReadingAloud(false);
    utterance.onerror = () => setIsReadingAloud(false);
    setIsReadingAloud(true);
    window.speechSynthesis.speak(utterance);
  };

  // Quiz State
  const QUIZ_QUESTIONS = useMemo(() => [
    {
      id: 'quiz-q1',
      question: "What does NSE stand for?",
      options: ["National Stock Exchange", "New Stock Engine", "National Securities Engine", "New Security Exchange"],
      correctIndex: 0,
      explanation: "NSE stands for National Stock Exchange of India, the leading stock exchange in India.",
      xp: 50
    },
    {
      id: 'quiz-q2',
      question: "If a company goes public for the very first time to raise money, what is it called?",
      options: ["FPO", "IPO", "ETF", "Mutual Fund"],
      correctIndex: 1,
      explanation: "An IPO (Initial Public Offering) is when a private company first sells shares of stock to the public.",
      xp: 50
    },
    {
      id: 'quiz-q3',
      question: "What is a 'Blue Chip' stock?",
      options: ["A stock that is colored blue on the terminal", "A highly speculative stock", "Shares of a large, well-established, and financially sound company", "A stock priced under ₹10"],
      correctIndex: 2,
      explanation: "Blue Chip stocks are giants of their industries (like Reliance or TCS) known for reliability and steady growth.",
      xp: 50
    },
    {
      id: 'quiz-q4',
      question: "What does the 'Bull Market' represent?",
      options: ["A market where prices are falling", "A market where prices are rising", "A market closed for trading", "A market with no buyers"],
      correctIndex: 1,
      explanation: "A Bull Market means stock prices are rising and investors are optimistic.",
      xp: 50
    }
  ], []);

  const [activeQuizIndex, setActiveQuizIndex] = useState(0);
  const [selectedAnswerIdx, setSelectedAnswerIdx] = useState<number | null>(null);


  const activeLesson = useMemo(() => {
    return localizedLessons.find((l) => l.id === activeLessonId) || localizedLessons[0];
  }, [activeLessonId, localizedLessons]);

  const activeStage = useMemo(
    () => LEARNING_PATH.find((stage) => stage.id === activeStageId) || LEARNING_PATH[0],
    [activeStageId],
  );

  /** Lessons belonging to a stage, in curriculum order. */
  const lessonsForStage = (stageId: LearningStageId): Lesson[] => {
    const stage = LEARNING_PATH.find((item) => item.id === stageId) || LEARNING_PATH[0];
    return (stage.lessonIds as readonly string[])
      .map((id) => localizedLessons.find((lesson) => lesson.id === id))
      .filter((lesson): lesson is Lesson => Boolean(lesson));
  };

  // A search looks across the whole Academy; with no search we stay inside the
  // selected stage so the list is never longer than a handful of modules.
  const filteredLessons = useMemo(() => {
    const query = lessonQuery.trim().toLowerCase();
    if (!query) return lessonsForStage(activeStageId);
    return localizedLessons.filter((lesson) => `${lesson.title} ${lesson.summary} ${lesson.category} ${INITIAL_LESSONS.find(item => item.id === lesson.id)?.title}`.toLowerCase().includes(query));
  }, [activeStageId, lessonQuery, localizedLessons]);

  // completeLesson() is also used by the daily quiz, so completedLessonIds can
  // contain quiz ids. Progress counters must only count real Academy modules.
  const completedModuleCount = useMemo(
    () => INITIAL_LESSONS.filter((lesson) => completedLessonIds.includes(lesson.id)).length,
    [completedLessonIds],
  );

  // Exam results, per stage. A stage opens only once the stage before it has
  // been passed, so a first-time learner starts at stage one with the rest shut.
  const [examScores, setExamScores] = useState<Record<string, number>>(() => {
    try { return JSON.parse(localStorage.getItem(`${academyKey}:exams`) || '{}'); } catch { return {}; }
  });

  useEffect(() => {
    localStorage.setItem(`${academyKey}:exams`, JSON.stringify(examScores));
  }, [academyKey, examScores]);

  // How each stage's questions have gone for this learner, so the next paper
  // can bring back what they got wrong and rest what they did not.
  const [examMemory, setExamMemory] = useState<Record<string, ExamMemory>>(() => {
    try {
      const stored = localStorage.getItem(`${academyKey}:examMemory`);
      if (stored) return JSON.parse(stored);
      // The older store remembered only which ids had been served. Carry it
      // over rather than starting a returning learner back on repeats.
      const legacy: Record<string, string[]> = JSON.parse(
        localStorage.getItem(`${academyKey}:examSeen`) || '{}',
      );
      return Object.fromEntries(
        Object.entries(legacy).map(([stageId, ids]) => [
          stageId,
          memoryFromSeenIds(Array.isArray(ids) ? ids : []),
        ]),
      );
    } catch {
      return {};
    }
  });

  useEffect(() => {
    localStorage.setItem(`${academyKey}:examMemory`, JSON.stringify(examMemory));
  }, [academyKey, examMemory]);

  const recordExamPaper = (stageId: string, results: QuestionResult[]) => {
    setExamMemory((previous) => ({
      ...previous,
      [stageId]: recordPaper(previous[stageId] ?? emptyExamMemory(), results),
    }));
  };

  // The server's grades are final, so a best score it has recorded counts
  // even when this device never saw the attempt.
  useEffect(() => {
    setExamScores(previous => {
      const next = { ...previous };
      for (const attempt of attempts) next[attempt.stageId] = Math.max(next[attempt.stageId] || 0, attempt.score);
      return next;
    });
  }, [attempts]);

  // Every attempt at this stage, newest first. There is one history — the
  // synced one — and the exam panel reads its slice of it rather than keeping
  // a second, device-only list that could disagree with the History tab.
  const stageAttempts = useMemo<ExamAttempt[]>(
    () =>
      attempts
        .filter((attempt) => attempt.stageId === activeStageId)
        .map((attempt) => ({ score: attempt.score, at: Date.parse(attempt.completedAt) || 0 }))
        .sort((a, b) => b.at - a.at)
        .slice(0, EXAM_ATTEMPT_HISTORY),
    [attempts, activeStageId],
  );

  const recordExamScore = (stageId: string, score: number, answers: Record<string, string>) => {
    recordAttempt(stageId, score, answers);
    setExamScores((previous) => ({
      ...previous,
      [stageId]: Math.max(previous[stageId] ?? 0, score),
    }));
  };

  const hasPassedExam = (stageId: string) => (examScores[stageId] ?? 0) >= EXAM_PASS_MARK;

  /** Stage 1 is always open; every later stage waits on the one before it. */
  const isStageUnlocked = (stageId: string) => {
    const index = LEARNING_PATH.findIndex((stage) => stage.id === stageId);
    if (index <= 0) return true;
    return hasPassedExam(LEARNING_PATH[index - 1].id);
  };

  const stageProgress = useMemo(() => LEARNING_PATH.map((stage) => {
    const ids = stage.lessonIds as readonly string[];
    const done = ids.filter((id) => completedLessonIds.includes(id)).length;
    return { id: stage.id, done, total: ids.length, complete: done === ids.length };
  }), [completedLessonIds]);

  // The stage the learner should tackle next: the first one not yet finished.
  const recommendedStageId = useMemo(
    () => (stageProgress.find((stage) => !stage.complete) || stageProgress[0]).id,
    [stageProgress],
  );

  const continueLesson = localizedLessons.find((lesson) => !completedLessonIds.includes(lesson.id) && isStageUnlocked(getStageForLesson(lesson.id))) || activeLesson;

  useEffect(() => { localStorage.setItem(`${academyKey}:last`, activeLessonId); }, [academyKey, activeLessonId]);
  useEffect(() => { localStorage.setItem(`${academyKey}:stage`, activeStageId); }, [academyKey, activeStageId]);

  // A saved stage can become unreachable (progress reset, exam results cleared),
  // which would leave the learner staring at a stage they cannot use.
  useEffect(() => {
    if (isStageUnlocked(activeStageId)) return;
    const highestOpen = [...LEARNING_PATH].reverse().find((stage) => isStageUnlocked(stage.id));
    const fallback = highestOpen || LEARNING_PATH[0];
    setActiveStageId(fallback.id);
    setActiveLessonId(fallback.lessonIds[0]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeStageId, examScores]);
  useEffect(() => { localStorage.setItem(`${academyKey}:bookmarks`, JSON.stringify(bookmarkedLessonIds)); }, [academyKey, bookmarkedLessonIds]);

  const toggleLessonBookmark = (lessonId: string) => {
    setBookmarkedLessonIds((previous) => previous.includes(lessonId) ? previous.filter((id) => id !== lessonId) : [...previous, lessonId]);
  };

  const isCurrentCompleted = completedLessonIds.includes(activeLesson.id);
  const practiceAction = getPracticeAction(activeLesson.id);

  const handleOptionSelect = (option: LessonQuizOption) => {
    if (isQuizSubmitted) return;
    setSelectedQuizOption(option);
  };

  const handleQuizSubmit = () => {
    if (!selectedQuizOption) return;
    setIsQuizSubmitted(true);
    if (selectedQuizOption.isCorrect) {
      completeLesson(activeLesson.id, activeLesson.xpReward);
    }
  };

  const handleSelectLesson = (lesson: Lesson) => {
    if (!isStageUnlocked(getStageForLesson(lesson.id))) return;
    setActiveLessonId(lesson.id);
    // Keep the stage selector in sync when a lesson is opened from a search
    // result, the "continue learning" button or another stage.
    setActiveStageId(getStageForLesson(lesson.id));
    setSelectedQuizOption(null);
    setIsQuizSubmitted(false);
  };

  const [selectedJargonCategory, setSelectedJargonCategory] = useState<string>('ALL');

  // Jargon Glossary with Categorization
  const jargonTerms = [
    { term: 'NIFTY 50', category: 'Market & Indices', desc: 'The flagship benchmark index of India containing the top 50 biggest companies by market cap on the NSE.' },
    { term: 'BULL MARKET', category: 'Market & Indices', desc: 'A market trend where prices are steadily climbing higher, driven by optimism and growing corporate profits.' },
    { term: 'BEAR MARKET', category: 'Market & Indices', desc: 'A market trend where prices fall 20% or more from peaks, driven by fear, recessions, or economic slowdowns.' },
    { term: 'BLUE CHIP', category: 'Market & Indices', desc: 'Large, established, financially sound industry leaders with trusted track records (like Reliance, TCS, HDFC Bank).' },
    { term: '52-WEEK HIGH / LOW', category: 'Market & Indices', desc: 'The highest and lowest price point a stock has traded at over the past 365 days.' },
    { term: 'P/E RATIO', category: 'Fundamentals & Valuation', desc: 'Price-to-Earnings: How many rupees you pay for ₹1 of company annual profit. Lower can indicate superior value.' },
    { term: 'EPS (Earnings Per Share)', category: 'Fundamentals & Valuation', desc: 'Total Net Annual Profit divided by the number of outstanding shares. Measures core earning power per share.' },
    { term: 'PEG RATIO', category: 'Fundamentals & Valuation', desc: 'P/E ratio divided by annual EPS earnings growth rate. PEG below 1.0 indicates undervalued high growth.' },
    { term: 'ROE (Return on Equity)', category: 'Fundamentals & Valuation', desc: 'Net Profit divided by Shareholders Equity. Measures how effectively management compounds invested capital (15%+ is strong).' },
    { term: 'EBITDA', category: 'Fundamentals & Valuation', desc: 'Earnings Before Interest, Taxes, Depreciation, and Amortization: Pure operational earnings before financing and accounting charges.' },
    { term: 'FREE CASH FLOW (FCF)', category: 'Fundamentals & Valuation', desc: 'Operating Cash Flow minus Capital Expenditures. Real liquid cash remaining to pay dividends or reinvest.' },
    { term: 'DIVIDEND', category: 'Fundamentals & Valuation', desc: 'A share of the company profits paid out directly in cash to all shareholders every quarter or year.' },
    { term: 'MARKET CAP', category: 'Fundamentals & Valuation', desc: 'The total value of all company shares: Stock Price × Total Number of Shares. Measured in Crores.' },
    { term: 'SIP (Systematic Investment Plan)', category: 'Trading & Strategy', desc: 'Investing a disciplined, fixed amount (like ₹1,000) every month into stocks or index funds to average acquisition costs.' },
    { term: 'RUPEE COST AVERAGING', category: 'Trading & Strategy', desc: 'The mathematical benefit of buying more units when prices dip and fewer when prices rise through recurring SIPs.' },
    { term: 'LIMIT ORDER', category: 'Trading & Strategy', desc: 'An order to buy/sell shares only at a specified price or better, eliminating slippage risk.' },
    { term: 'STOP LOSS (SL)', category: 'Trading & Strategy', desc: 'An automatic order to exit a losing position at a predetermined floor to prevent severe capital drawdown.' },
    { term: 'RISK-TO-REWARD RATIO', category: 'Trading & Strategy', desc: 'Comparing potential downside loss against upside target (e.g. risking ₹10 to gain ₹30 gives a 1:3 ratio).' },
    { term: 'CIRCUIT BREAKER / LIMITS', category: 'Trading & Strategy', desc: 'SEBI mechanism that halts trading if a stock or market rises/drops too fast in one day (e.g. 5%, 10%, 20%) to prevent panic.' },
    { term: 'DEMAT ACCOUNT', category: 'Regulation & Demat', desc: 'Dematerialized Account: The secure digital locker where your electronic shares are stored in India via NSDL or CDSL.' },
    { term: 'SEBI', category: 'Regulation & Demat', desc: 'Securities and Exchange Board of India: The market regulator and referee that protects retail investors and teens.' },
    { term: 'FII & DII', category: 'Macro & ESG', desc: 'Foreign Institutional Investors (global funds) and Domestic Institutional Investors (Indian mutual funds and LIC) driving market liquidity.' },
    { term: 'CARBON CREDIT', category: 'Macro & ESG', desc: 'A transferable regulatory permit representing the legal right to emit 1 metric ton of carbon dioxide or equivalent GHG.' },
    { term: 'ESG INVESTING', category: 'Macro & ESG', desc: 'Evaluating companies based on Environmental impact, Social responsibility, and Corporate Governance standards.' }
  ];

  const jargonCategories = ['ALL', 'Fundamentals & Valuation', 'Market & Indices', 'Trading & Strategy', 'Regulation & Demat', 'Macro & ESG'];

  const filteredJargon = jargonTerms.filter((j) => {
    const matchesCategory = selectedJargonCategory === 'ALL' || j.category === selectedJargonCategory;
    const query = jargonQuery.toLowerCase().trim();
    const matchesQuery = !query || j.term.toLowerCase().includes(query) || j.desc.toLowerCase().includes(query) || j.category.toLowerCase().includes(query);
    return matchesCategory && matchesQuery;
  });

  return (
    <div className="rr-surfaces space-y-6">
      
      {/* Academy Top Header & Sub-Navigation */}
      <div className="bg-white border border-slate-200 rounded-3xl p-4 sm:p-6 shadow-sm flex flex-col items-start gap-5">
        <div className="min-w-0 w-full">
          <div role="group" aria-label="Lesson language" className="mb-4 inline-flex rounded border border-slate-300 p-1 dark:border-slate-600">
            {([["ENGLISH", "English"], ["HINDI", "हिंदी"]] as const).map(([value, label]) => <button key={value} type="button" lang={value === "HINDI" ? "hi" : "en"} aria-pressed={settings.learningLanguage === value} onClick={() => { window.speechSynthesis?.cancel(); setIsReadingAloud(false); updateSetting("learningLanguage", value); }} className={`rounded px-4 py-2 text-sm font-bold ${settings.learningLanguage === value ? "bg-emerald-700 text-white" : "text-slate-700 dark:text-slate-200"}`}>{label}</button>)}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2">
              <BookOpen className="w-6 h-6 text-slate-900 " />
              {hindi ? 'किशोर निवेशक अकादमी' : 'Investor Academy for Teens'}
            </h2>
            <span className="bg-emerald-100 text-emerald-800 text-xs font-black px-2.5 py-0.5 rounded-full">
              {completedModuleCount} / {INITIAL_LESSONS.length} {hindi ? 'पूरे' : 'Completed'}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
            {settings.learningLanguage === 'HINDI' ? 'छोटे और सरल पाठों से valuation, compounding और बाज़ार जोखिम को चरण-दर-चरण समझें।' : 'Master stock valuation, compounding superpowers, and market risk through bite-sized interactive modules.'}
          </p>
          <p className="mt-2 text-[11px] font-bold text-indigo-700">{hindi ? `सुझाया गया पाठ: ${localizeLesson(recommendedLesson, 'HINDI').title}` : `First lesson for your ${currentUser?.experienceLevel?.toLowerCase() || 'beginner'} level: ${recommendedLesson.title.split(':')[0]}`}</p>
          <button
            type="button"
            onClick={() => { setActiveSubTab('LESSONS'); setLessonQuery(''); handleSelectLesson(continueLesson); }}
            className="mt-3 flex w-full items-center justify-between gap-3 rounded-xl bg-indigo-600 px-4 py-2.5 text-left text-xs font-black text-white hover:bg-indigo-700 sm:w-auto sm:min-w-[320px]"
          >
            <span className="min-w-0">
              <span className="block">{hindi ? "सीखना जारी रखें" : "Continue learning"}</span>
              <span className="mt-0.5 block truncate font-bold text-indigo-100">{continueLesson.title.split(':')[0]}</span>
            </span>
            <ArrowRight className="h-4 w-4 shrink-0" />
          </button>

          {/* Stage picker — choose the stage you are on and only its modules load. */}
          <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/60">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-xs font-black text-slate-900 dark:text-white">{hindi ? 'अपना चरण चुनें' : 'Pick the stage you are on'}</h3>
                <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">{hindi ? 'अगले चरण के लिए पिछले चरण की परीक्षा पास करें।' : 'Only that stage\'s modules are shown, so the list stays short.'}</p>
              </div>
              <span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-black text-indigo-700 dark:bg-slate-900 dark:text-indigo-300">
                {completedModuleCount}/{INITIAL_LESSONS.length} {hindi ? 'पाठ' : 'modules'}
              </span>
            </div>

            <ol className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3">
              {LEARNING_PATH.map((stage, index) => {
                const progress = stageProgress[index];
                const selected = stage.id === activeStageId && activeSubTab === 'LESSONS';
                const recommended = stage.id === recommendedStageId;
                const unlocked = isStageUnlocked(stage.id);
                const passed = hasPassedExam(stage.id);
                const previousStageName = index > 0 ? LEARNING_PATH[index - 1].name : '';
                return (
                  <li key={stage.id}>
                    <button
                      type="button"
                      aria-pressed={selected}
                      disabled={!unlocked}
                      title={unlocked ? undefined : `Pass the ${previousStageName} exam to open this stage`}
                      onClick={() => {
                        if (!unlocked) return;
                        setActiveSubTab('LESSONS');
                        setActiveStageId(stage.id);
                        setLessonQuery('');
                        const stageLessons = lessonsForStage(stage.id);
                        const nextLesson = stageLessons.find((lesson) => !completedLessonIds.includes(lesson.id)) || stageLessons[0];
                        if (nextLesson) handleSelectLesson(nextLesson);
                      }}
                      className={`h-full w-full rounded-xl border p-3 text-left transition-all ${
                        !unlocked
                          ? 'cursor-not-allowed border-slate-200 bg-slate-100 opacity-70 dark:border-slate-800 dark:bg-slate-900/60'
                          : selected
                          ? 'border-slate-900 bg-slate-900 text-white shadow-sm dark:border-indigo-400 dark:bg-indigo-700'
                          : passed
                          ? 'border-emerald-300 bg-emerald-50 hover:border-emerald-400 dark:border-emerald-900 dark:bg-emerald-950/30'
                          : 'border-slate-200 bg-white hover:border-indigo-300 dark:border-slate-700 dark:bg-slate-900'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className={`text-[10px] font-black uppercase tracking-wide ${selected ? 'text-indigo-200' : 'text-slate-500 dark:text-slate-400'}`}>
                          {hindi ? 'चरण' : 'Stage'} {index + 1}
                        </span>
                        {!unlocked
                          ? <Lock className="h-4 w-4 text-slate-400" />
                          : passed
                          ? <CheckCircle2 className={`h-4 w-4 ${selected ? 'text-emerald-300' : 'text-emerald-600'}`} />
                          : progress.complete
                          ? <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[9px] font-black text-amber-800 dark:bg-amber-950 dark:text-amber-300">EXAM</span>
                          : recommended && !selected
                          ? <span className="rounded-full bg-indigo-100 px-1.5 py-0.5 text-[9px] font-black text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">NEXT</span>
                          : null}
                      </div>
                      <p className="mt-1 flex items-center gap-1.5 text-xs font-black">
                        <span aria-hidden="true">{stage.icon}</span>
                        {stage.name}
                      </p>
                      <p className={`mt-1 text-[11px] leading-relaxed ${selected ? 'text-slate-300' : 'text-slate-600 dark:text-slate-300'}`}>
                        {unlocked ? stage.outcome : `Locked — pass the ${previousStageName} exam to open this stage.`}
                      </p>
                      <div className="mt-2 flex items-center gap-2">
                        <span className={`h-1.5 flex-1 overflow-hidden rounded-full ${selected ? 'bg-white/20' : 'bg-slate-200 dark:bg-slate-700'}`}>
                          <span
                            className={`block h-full rounded-full ${progress.complete ? 'bg-emerald-500' : 'bg-indigo-500'}`}
                            style={{ width: `${(progress.done / progress.total) * 100}%` }}
                          />
                        </span>
                        <span className={`font-mono text-[10px] font-black ${selected ? 'text-slate-300' : 'text-slate-500 dark:text-slate-400'}`}>
                          {progress.done}/{progress.total}
                        </span>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ol>
          </div>
        </div>

        {/* Sub-Tabs. The stages behind them are gated, but every section here
            stays reachable so reference material is never locked away. */}
        <div className="grid w-full grid-cols-2 gap-1.5 rounded-2xl border border-slate-200 bg-slate-50 p-1.5 sm:grid-cols-3 xl:grid-cols-5 2xl:grid-cols-9">
          {ACADEMY_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              aria-pressed={activeSubTab === tab.id}
              onClick={() => setActiveSubTab(tab.id)}
              className={`min-h-11 rounded-xl px-2 py-2 text-center text-xs font-black leading-tight transition-all cursor-pointer ${
                activeSubTab === tab.id
                  ? 'bg-slate-900 text-white shadow-xs dark:bg-indigo-600'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white'
              }`}
            >
              {tab.icon} {hindi ? ACADEMY_TAB_HINDI[tab.id] : tab.label}
              {tab.count !== undefined && ` (${tab.count})`}
            </button>
          ))}
        </div>
      </div>

      {/* VIEW 1: LESSONS & QUIZZES */}
      {activeSubTab === 'LESSONS' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/*
            The module list comes before the lesson in the source, so reaching
            the lesson by keyboard meant tabbing past every module in the
            stage, every time. These jump straight to either one.
          */}
          <SectionSkipLinks
            label="Skip within the Academy"
            targets={[
              { id: 'academy-lesson', label: 'Skip to the lesson' },
              { id: 'academy-modules', label: 'Skip to the module list' },
            ]}
          />

          {/* Left 4 Cols: Stage Modules & Search */}
          <div id="academy-modules" tabIndex={-1} className="lg:col-span-4 space-y-3">
            <div className="rounded-2xl border border-indigo-200 bg-indigo-50 px-3 py-2.5 dark:border-indigo-900 dark:bg-indigo-950/40">
              <p className="text-[10px] font-black uppercase tracking-wider text-indigo-700 dark:text-indigo-300">
                {lessonQuery.trim() ? 'Searching all modules' : `Stage ${LEARNING_PATH.findIndex((stage) => stage.id === activeStageId) + 1} · ${activeStage.name}`}
              </p>
              <p className="mt-0.5 text-[11px] font-medium leading-snug text-indigo-950 dark:text-indigo-100">
                {lessonQuery.trim() ? `${filteredLessons.length} module${filteredLessons.length === 1 ? '' : 's'} match your search across the whole Academy.` : activeStage.blurb}
              </p>
            </div>
            <label className="relative block">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input type="search" value={lessonQuery} onChange={(event) => setLessonQuery(event.target.value)} aria-label={hindi ? 'पाठ खोजें' : 'Search lessons'} placeholder={hindi ? 'सभी पाठ और विषय खोजें' : 'Search all lessons and topics'} className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-xs font-bold text-slate-800 outline-none focus:border-indigo-400" />
            </label>
            
            <div className="space-y-2.5">
              {filteredLessons.map((lesson) => {
                const idx = INITIAL_LESSONS.findIndex((item) => item.id === lesson.id);
                const isCompleted = completedLessonIds.includes(lesson.id);
                const isActive = lesson.id === activeLessonId;

                return (
                  <div
                    key={lesson.id}
                    onClick={() => handleSelectLesson(lesson)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                      isActive
                        ? 'bg-slate-50 border-zinc-500 shadow-sm'
                        : isCompleted
                        ? 'bg-white border-emerald-200 hover:border-emerald-300'
                        : 'bg-white border-slate-200 hover:border-slate-200 '
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-extrabold text-xs shrink-0 ${
                        isCompleted
                          ? 'bg-emerald-600 text-white'
                          : isActive
                          ? 'bg-slate-900 text-white dark:bg-indigo-600'
                          : 'bg-slate-50 text-slate-900 border border-slate-200 '
                      }`}>
                        {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                      </div>
                      <div>
                        <h4 className={`text-xs font-extrabold ${isActive ? 'text-slate-900 ' : 'text-slate-900 '}`}>
                          {lesson.title.split(':')[0]}
                        </h4>
                        <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-0.5 font-medium">
                          <span>{lesson.category}</span>
                          <span>•</span>
                          <span className="text-indigo-600 font-bold">+{lesson.xpReward} XP</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-1">
                      <button type="button" onClick={(event) => { event.stopPropagation(); toggleLessonBookmark(lesson.id); }} className={`rounded-lg p-1.5 ${bookmarkedLessonIds.includes(lesson.id) ? 'bg-amber-100 text-amber-700' : 'text-slate-400 hover:bg-slate-100'}`} aria-label={`${bookmarkedLessonIds.includes(lesson.id) ? 'Remove' : 'Add'} bookmark for ${lesson.title}`}><Bookmark className={`h-3.5 w-3.5 ${bookmarkedLessonIds.includes(lesson.id) ? 'fill-current' : ''}`} /></button>
                      <ChevronRight className={`w-4 h-4 ${isActive ? 'text-slate-900 ' : 'text-slate-500'}`} />
                    </div>
                  </div>
                );
              })}
              {(() => {
                const index = LEARNING_PATH.findIndex((stage) => stage.id === activeStageId);
                const progress = stageProgress[index];
                const isLastStage = index === LEARNING_PATH.length - 1;
                if (!progress?.complete || lessonQuery.trim()) return null;
                if (hasPassedExam(activeStageId)) {
                  return (
                    <div className="rounded-2xl border border-emerald-300 bg-emerald-50 p-3 text-center dark:border-emerald-800 dark:bg-emerald-950/40">
                      <p className="text-[11px] font-black text-emerald-900 dark:text-emerald-200">
                        Stage {index + 1} passed with {examScores[activeStageId]}/{EXAM_LENGTH}
                      </p>
                      <p className="mt-0.5 text-[10px] font-medium text-emerald-800/80 dark:text-emerald-300/80">
                        {isLastStage ? 'You have finished every stage.' : `Stage ${index + 2} is open.`}
                      </p>
                    </div>
                  );
                }
                return (
                  <button
                    type="button"
                    onClick={() => setActiveSubTab('STAGE_EXAM')}
                    className="w-full rounded-2xl border border-amber-300 bg-amber-50 p-3 text-left transition-colors hover:bg-amber-100 dark:border-amber-800 dark:bg-amber-950/40 dark:hover:bg-amber-900/40"
                  >
                    <p className="text-[11px] font-black text-amber-900 dark:text-amber-200">
                      All {progress.total} modules done — take the stage exam
                    </p>
                    <p className="mt-0.5 text-[10px] font-medium leading-snug text-amber-800/80 dark:text-amber-300/80">
                      {EXAM_LENGTH} questions, {EXAM_PASS_MARK} to pass.
                      {isLastStage ? ' It completes the path.' : ' Passing opens the next stage.'}
                    </p>
                  </button>
                );
              })()}

              {filteredLessons.length === 0 && (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5 text-center text-xs font-medium text-slate-500">
                  No lessons match “{lessonQuery}”.
                  <button type="button" onClick={() => setLessonQuery('')} className="mt-2 block w-full rounded-lg bg-slate-900 px-3 py-2 text-[11px] font-black text-white">
                    Back to {activeStage.name} modules
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Right 8 Cols: Active Lesson Reader & Interactive Quiz */}
          <div id="academy-lesson" tabIndex={-1} className="lg:col-span-8 bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6">
            
            {/* Lesson Title Header */}
            <div className="border-b border-slate-200 pb-4">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-extrabold text-slate-900 bg-slate-50 border border-slate-200 px-3 py-1 rounded-full">
                  {activeLesson.category}
                </span>
                <div className="flex flex-wrap items-center justify-end gap-2"><span className="text-xs text-slate-500 font-medium">{activeLesson.readTime} • +{activeLesson.xpReward} XP</span><button type="button" onClick={toggleReadAloud} className={`min-h-10 rounded-xl border px-3 text-xs font-black ${isReadingAloud ? 'border-emerald-400 bg-emerald-100 text-emerald-900' : 'border-slate-200 text-slate-600'}`} aria-pressed={isReadingAloud}>{isReadingAloud ? <VolumeX className="inline h-4 w-4" /> : <Volume2 className="inline h-4 w-4" />} <span className="ml-1">{isReadingAloud ? (hindi ? 'रोकें' : 'Stop') : (hindi ? 'सुनें' : 'Listen')}</span></button><button type="button" onClick={() => toggleLessonBookmark(activeLesson.id)} className={`min-h-10 rounded-xl border p-2.5 ${bookmarkedLessonIds.includes(activeLesson.id) ? 'border-amber-300 bg-amber-100 text-amber-700' : 'border-slate-200 text-slate-500'}`} aria-label="Toggle lesson bookmark"><Bookmark className={`h-4 w-4 ${bookmarkedLessonIds.includes(activeLesson.id) ? 'fill-current' : ''}`} /></button></div>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-3">
                {activeLesson.title}
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-1 italic font-medium">
                &ldquo;{activeLesson.tagline}&rdquo;
              </p>
            </div>

            {/* Lesson Content Sections */}
            <div className="space-y-7 text-slate-700 dark:text-slate-200 text-base leading-7">
              {activeLesson.sections.map((sec, sIdx) => (
                <div key={sIdx} className="space-y-3">
                  <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-slate-900 " />
                    {sec.heading}
                  </h3>
                  <div className="academy-reading"><FormattedLessonContent content={sec.content} /></div>

                  {/* Relatable Analogy Box */}
                  {sec.exampleBox && (
                    <div className="bg-indigo-600/10 border border-indigo-600/30 rounded-2xl p-4 my-3">
                      <div className="font-extrabold text-indigo-600 text-xs sm:text-sm mb-1">
                        {sec.exampleBox.title}
                      </div>
                      <p className="text-xs text-indigo-600 leading-relaxed">
                        {sec.exampleBox.description}
                      </p>
                      <p className="text-xs text-indigo-600 font-bold mt-2 pt-2 border-t border-indigo-600/30">
                        💡 <strong>Real-World Takeaway:</strong> {sec.exampleBox.analogy}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Key Takeaways */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600 " />
                {hindi ? 'याद रखने योग्य बातें' : 'Key Rookie Rules to Remember'}
              </h4>
              <ul className="text-xs text-slate-500 space-y-1.5 font-medium">
                {activeLesson.keyTakeaways.map((point, kIdx) => (
                  <li key={kIdx} className="flex items-start gap-2">
                    <span className="text-emerald-600 font-extrabold">✓</span>
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* CHECKPOINT QUIZ */}
            <div className="bg-slate-50 border-2 border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <HelpCircle className="w-5 h-5 text-slate-900 " />
                  <h4 className="text-sm font-black text-slate-900 ">
                    {hindi ? 'अपनी समझ जाँचें' : 'Knowledge Checkpoint'} (+{activeLesson.xpReward} XP)
                  </h4>
                </div>
                {isCurrentCompleted && (
                  <span className="text-xs font-black text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> {hindi ? "पाठ पूरा" : "Module Mastered"}
                  </span>
                )}
              </div>

              <p className="text-xs sm:text-sm font-extrabold text-slate-900 ">
                {activeLesson.quiz.question}
              </p>

              {/* Quiz Options */}
              <div className="space-y-2.5">
                {activeLesson.quiz.options.map((opt) => {
                  const isSelected = selectedQuizOption?.id === opt.id;
                  let optStyle = 'bg-white border-slate-200 text-zinc-700 hover:border-slate-200 ';

                  if (isQuizSubmitted) {
                    if (opt.isCorrect) {
                      optStyle = 'bg-emerald-50 border-emerald-500 text-emerald-900 font-bold';
                    } else if (isSelected && !opt.isCorrect) {
                      optStyle = 'bg-rose-50 border-rose-400 text-rose-900';
                    }
                  } else if (isSelected) {
                    optStyle = 'bg-slate-50 border-zinc-600 text-slate-900 font-bold shadow-xs';
                  }

                  return (
                    <div
                      key={opt.id}
                      onClick={() => handleOptionSelect(opt)}
                      className={`p-3.5 rounded-xl border text-xs cursor-pointer transition-all ${optStyle}`}
                    >
                      <div className="flex items-center justify-between">
                        <span>{opt.text}</span>
                        {isQuizSubmitted && opt.isCorrect && (
                          <span className="text-emerald-700 font-black text-[11px]">{hindi ? 'सही उत्तर' : 'Correct Answer'} ✓</span>
                        )}
                      </div>

                      {isQuizSubmitted && (isSelected || opt.isCorrect) && (
                        <p className="mt-2 text-[11px] text-slate-500 border-t border-slate-200 pt-1.5 font-medium">
                          {opt.explanation}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Submit / Retry Button */}
              <div className="pt-2 flex items-center justify-end gap-3">
                {!isQuizSubmitted ? (
                  <button
                    onClick={handleQuizSubmit}
                    disabled={!selectedQuizOption}
                    className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-indigo-700 disabled:opacity-50 text-white font-extrabold text-xs shadow-md shadow-indigo-600/20 transition-all"
                  >
                    {hindi ? 'उत्तर जमा करें और XP पाएँ' : 'Submit Answer & Earn XP'}
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setSelectedQuizOption(null);
                      setIsQuizSubmitted(false);
                    }}
                    className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-zinc-700 text-xs font-bold hover:bg-slate-50 flex items-center gap-1.5"
                  >
                    <RotateCcw className="w-3.5 h-3.5" /> {hindi ? "दोबारा प्रयास करें" : "Try Quiz Again"}
                  </button>
                )}
              </div>

              {/* Hand the finished lesson over to the part of the app where it
                  can actually be used. */}
              {isCurrentCompleted && practiceAction && (
                <div className="rounded-2xl border border-indigo-300 bg-indigo-50 p-4">
                  <p className="text-[10px] font-black uppercase tracking-wider text-indigo-700">
                    Put it into practice
                  </p>
                  <p className="mt-1 text-sm font-black leading-snug text-indigo-950">{practiceAction.task}</p>
                  <p className="mt-1 text-[11px] font-medium leading-relaxed text-indigo-900/80">
                    {practiceAction.reason}
                  </p>
                  {setActiveTab ? (
                    <button
                      type="button"
                      onClick={() => {
                        startPracticeTask(practiceAction, activeLesson.title.split(':')[0]);
                        setActiveTab(practiceAction.tab);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="mt-3 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-black text-white hover:bg-indigo-700"
                    >
                      {practiceAction.label} <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  ) : (
                    <p className="mt-3 text-[11px] font-bold text-indigo-800">
                      Open the {practiceAction.tab} section to try this.
                    </p>
                  )}
                </div>
              )}

            </div>

          </div>

        </div>
      )}

      {activeSubTab === 'HISTORY' && <ExamHistory attempts={attempts} name={currentUser?.fullName || 'Learner'} notice={notice} onSync={() => void sync()} />}
      {activeSubTab === 'LEADERBOARD' && <CohortLeaderboard userId={currentUser?.id} onBattle={() => window.dispatchEvent(new CustomEvent('open-stock-battle'))} />}

      {/* VIEW: CASE STUDIES & COMPANY-VS-COMPANY COMPARISONS */}
      {/* VIEW: STAGE GATE EXAM */}
      {activeSubTab === 'STAGE_EXAM' && (() => {
        const exam = getStageExam(activeStageId);
        const stageIndex = LEARNING_PATH.findIndex((stage) => stage.id === activeStageId);
        const progress = stageProgress[stageIndex] ?? { done: 0, total: 0 };
        if (!exam) return null;
        return (
          <StageExam
            exam={exam}
            stageName={activeStage.name}
            stageNumber={stageIndex + 1}
            modulesRemaining={progress.total - progress.done}
            passed={hasPassedExam(activeStageId)}
            bestScore={examScores[activeStageId] ?? null}
            key={activeStageId}
            attempts={stageAttempts}
            memory={examMemory[activeStageId] ?? emptyExamMemory()}
            onPaperGraded={(results) => recordExamPaper(activeStageId, results)}
            onRecordAttempt={(score, answers) => recordExamScore(activeStageId, score, answers)}
            onPass={(score) => {
              // The exam is worth XP in its own right, tracked like a lesson so
              // it survives a reload with the rest of the learner's progress.
              completeLesson(`exam-${activeStageId}`, 250);
            }}
          />
        );
      })()}

      {/* VIEW: 1v1 BATTLE ARENA — a comparison drill, so it belongs with the
          rest of the learning tools rather than floating in the header. */}
      {activeSubTab === 'BATTLE' && (
        <div className="rounded-2xl border border-violet-200 bg-violet-50 p-6 text-center dark:border-violet-900 dark:bg-violet-950/40">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 text-white">
            <Swords className="h-6 w-6" />
          </span>
          <h3 className="mt-3 text-lg font-black text-violet-950 dark:text-violet-100">
            1v1 Blue-Chip Battle Arena
          </h3>
          <p className="mx-auto mt-1.5 max-w-lg text-xs leading-relaxed text-violet-900/80 dark:text-violet-200/80">
            Put two rival blue-chips head to head and watch valuation, growth and momentum pull
            against each other. It is the fastest way to practise the comparison the Lessons
            keep asking for: a number only means something next to a comparable one.
          </p>
          <button
            type="button"
            onClick={() => window.dispatchEvent(new CustomEvent('open-stock-battle'))}
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 via-indigo-600 to-purple-600 px-4 py-2.5 text-xs font-black text-white shadow-sm hover:shadow-md"
          >
            <Swords className="h-4 w-4 text-amber-300" />
            Open the Battle Arena
            <span className="rounded bg-amber-400/30 px-1.5 py-0.5 text-[9px] font-black uppercase text-amber-100">VS</span>
          </button>
        </div>
      )}

      {activeSubTab === 'CASE_STUDIES' && (
        <div className="space-y-6">
          {/* Category Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {['ALL', 'FMCG & Consumer', 'Tech & Platforms', 'Banking & BFSI', 'Automobile & EV', 'IT & Software'].map((cat) => (
              <button
                key={cat}
                onClick={() => setCaseStudyCategory(cat)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all whitespace-nowrap cursor-pointer ${
                  caseStudyCategory === cat
                    ? 'bg-slate-900 text-white shadow-xs dark:bg-indigo-600'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                {cat === 'ALL' ? '🔥 All Case Studies' : cat}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <SectionSkipLinks
              label="Skip within the case studies"
              targets={[
                { id: 'academy-case', label: 'Skip to the case study' },
                { id: 'academy-case-list', label: 'Skip to the case study list' },
              ]}
            />

            {/* Left 4 Cols: Case Study Selector */}
            <div id="academy-case-list" tabIndex={-1} className="lg:col-span-4 space-y-3">
              <div className="bg-white border border-slate-200 rounded-3xl p-4 sm:p-5 shadow-xs space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <Layers className="w-5 h-5 text-indigo-600" />
                    <h3 className="font-extrabold text-sm text-slate-900">Case Studies ({CASE_STUDIES_DATA.length})</h3>
                  </div>
                  <span className="hidden text-[10px] font-bold text-slate-500 uppercase tracking-wider sm:inline">
                    Dalal Street Battles
                  </span>
                </div>

                {/* A nested scroll area inside a page that already scrolls is
                    awkward on a phone, so the cap only applies from lg upwards. */}
                <div className="space-y-2 lg:max-h-[600px] lg:overflow-y-auto lg:pr-1">
                  {CASE_STUDIES_DATA.filter((cs) => caseStudyCategory === 'ALL' || cs.category === caseStudyCategory).map((cs) => {
                    const isSelected = cs.id === activeCaseStudyId;

                    return (
                      <button
                        key={cs.id}
                        onClick={() => setActiveCaseStudyId(cs.id)}
                        className={`w-full text-left p-3.5 rounded-2xl border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-slate-900 text-white border-slate-900 shadow-xs dark:border-indigo-500 dark:bg-indigo-700'
                            : 'bg-white border-slate-200 text-slate-800 hover:border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md ${
                            isSelected ? 'bg-white/20 text-amber-300' : 'bg-indigo-50 text-indigo-700 border border-indigo-100'
                          }`}>
                            {cs.category}
                          </span>
                          <span className={`text-[10px] font-bold ${isSelected ? 'text-slate-300' : 'text-slate-400'}`}>
                            {cs.readTime}
                          </span>
                        </div>

                        <h4 className={`text-xs font-black leading-snug mb-1.5 ${isSelected ? 'text-white' : 'text-slate-900'}`}>
                          {cs.title}
                        </h4>

                        <div className="flex flex-wrap items-center gap-1">
                          {cs.companies.map((co) => (
                            <span
                              key={co}
                              className={`text-[9px] font-black font-mono px-1.5 py-0.5 rounded ${
                                isSelected ? 'bg-white/15 text-slate-200' : 'bg-slate-100 text-slate-700'
                              }`}
                            >
                              {co}
                            </span>
                          ))}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Right 8 Cols: Detailed Case Study & Comparison Matrix */}
            <div id="academy-case" tabIndex={-1} className="lg:col-span-8">
              {(() => {
                const currentCase = CASE_STUDIES_DATA.find((c) => c.id === activeCaseStudyId) || CASE_STUDIES_DATA[0];

                return (
                  <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-8">
                    
                    {/* Header */}
                    <div className="border-b border-slate-100 pb-6 space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-extrabold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-100 uppercase tracking-wide">
                            {currentCase.category}
                          </span>
                          <span className="text-[11px] font-bold text-slate-500">
                            ⏱️ {currentCase.readTime}
                          </span>
                        </div>
                        <span className="text-xs font-black text-amber-800 bg-amber-50 px-3 py-1 rounded-full border border-amber-200 flex items-center gap-1.5">
                          <Award className="w-3.5 h-3.5 text-amber-600" /> {currentCase.badge}
                        </span>
                      </div>

                      <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-snug">
                        {currentCase.title}
                      </h2>

                      <p className="text-xs sm:text-sm font-bold text-slate-500 leading-relaxed">
                        {currentCase.tagline}
                      </p>

                      {/* Stock Badges */}
                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        <span className="text-xs font-bold text-slate-500">Companies Studied:</span>
                        {currentCase.companies.map((sym) => (
                          <span
                            key={sym}
                            className="text-xs font-black font-mono text-indigo-900 bg-indigo-50 px-2.5 py-1 rounded-xl border border-indigo-200"
                          >
                            NSE: {sym}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Hero Highlight Box */}
                    <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white p-5 sm:p-6 rounded-2xl shadow-xs space-y-2">
                      <span className="text-[10px] font-black uppercase tracking-widest text-amber-400 block">
                        Case Study Premise
                      </span>
                      <h3 className="text-base sm:text-lg font-black leading-snug text-white">
                        {currentCase.heroHeadline}
                      </h3>
                      <p className="text-xs sm:text-sm text-slate-300 font-medium leading-relaxed pt-1 whitespace-pre-line">
                        {currentCase.narrativeOverview}
                      </p>
                    </div>

                    {/* Core Business Battles */}
                    <div className="space-y-4">
                      <h3 className="text-sm sm:text-base font-black text-slate-900 flex items-center gap-2">
                        <Zap className="w-4 h-4 text-amber-500" />
                        {currentCase.coreBusinessBattle.title}
                      </h3>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {currentCase.coreBusinessBattle.points.map((pt, pIdx) => (
                          <div
                            key={pIdx}
                            className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2 flex flex-col justify-between"
                          >
                            <div>
                              <div className="w-6 h-6 rounded-lg bg-indigo-100 text-indigo-700 font-black text-xs flex items-center justify-center mb-2">
                                {pIdx + 1}
                              </div>
                              <h4 className="text-xs font-black text-slate-900 leading-snug mb-1">
                                {pt.headline}
                              </h4>
                              <p className="text-[11px] sm:text-xs text-slate-600 leading-relaxed font-medium">
                                {pt.detail}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* SIDE-BY-SIDE FINANCIAL METRICS COMPARISON TABLE */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm sm:text-base font-black text-slate-900 flex items-center gap-2">
                          <Calculator className="w-4 h-4 text-indigo-600" />
                          Head-to-Head Financial Metrics Comparison
                        </h3>
                        <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">
                          Key Value Drivers
                        </span>
                      </div>

                      <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
                        <div className="overflow-x-auto">
                          <table className="w-full text-left border-collapse text-xs">
                            <thead>
                              <tr className="bg-slate-100/80 border-b border-slate-200 text-slate-700 font-black">
                                <th className="p-3.5">Financial Metric</th>
                                <th className="p-3.5 text-center">{currentCase.metricsTable[0].companyA.name}</th>
                                <th className="p-3.5 text-center">{currentCase.metricsTable[0].companyB.name}</th>
                                {currentCase.metricsTable[0].companyC && (
                                  <th className="p-3.5 text-center">{currentCase.metricsTable[0].companyC.name}</th>
                                )}
                                <th className="p-3.5 min-w-[200px]">Why This Metric Matters</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                              {currentCase.metricsTable.map((row, rIdx) => (
                                <tr key={rIdx} className="hover:bg-slate-50/80 transition-colors">
                                  <td className="p-3.5 font-bold text-slate-900">
                                    {row.metric}
                                    <span className="text-[10px] font-normal text-slate-400 block">({row.unit})</span>
                                  </td>
                                  <td className="p-3.5 text-center">
                                    <span className="font-black font-mono text-slate-900 block text-xs sm:text-sm">
                                      {row.companyA.value}
                                    </span>
                                    {row.companyA.note && (
                                      <span className="text-[10px] text-slate-500 block leading-tight mt-0.5">
                                        {row.companyA.note}
                                      </span>
                                    )}
                                  </td>
                                  <td className="p-3.5 text-center">
                                    <span className="font-black font-mono text-slate-900 block text-xs sm:text-sm">
                                      {row.companyB.value}
                                    </span>
                                    {row.companyB.note && (
                                      <span className="text-[10px] text-slate-500 block leading-tight mt-0.5">
                                        {row.companyB.note}
                                      </span>
                                    )}
                                  </td>
                                  {row.companyC && (
                                    <td className="p-3.5 text-center">
                                      <span className="font-black font-mono text-slate-900 block text-xs sm:text-sm">
                                        {row.companyC.value}
                                      </span>
                                      {row.companyC.note && (
                                        <span className="text-[10px] text-slate-500 block leading-tight mt-0.5">
                                          {row.companyC.note}
                                        </span>
                                      )}
                                    </td>
                                  )}
                                  <td className="p-3.5 text-slate-600 text-[11px] leading-relaxed">
                                    {row.importance}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>

                    {/* Strategic Moats & Market Insights */}
                    <div className="space-y-4">
                      <h3 className="text-sm sm:text-base font-black text-slate-900 flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-emerald-600" />
                        Strategic Moat Insights & Unfair Advantages
                      </h3>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {currentCase.strategicInsights.map((ins, iIdx) => (
                          <div
                            key={iIdx}
                            className="p-4 rounded-2xl bg-indigo-50/40 border border-indigo-100 space-y-1.5"
                          >
                            <h4 className="text-xs font-black text-indigo-950 flex items-center gap-1.5">
                              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                              {ins.title}
                            </h4>
                            <p className="text-xs text-indigo-900/80 font-medium leading-relaxed">
                              {ins.description}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Lessons, Checklist & Pitfalls 3-Column Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                      {/* Key Lessons */}
                      <div className="bg-emerald-50/60 border border-emerald-200 rounded-2xl p-4 space-y-2">
                        <h4 className="text-xs font-black text-emerald-950 uppercase tracking-wider flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          Key Investor Lessons
                        </h4>
                        <ul className="space-y-1.5">
                          {currentCase.keyLessons.map((les, lIdx) => (
                            <li key={lIdx} className="text-[11px] text-emerald-900 flex items-start gap-1.5 leading-relaxed font-medium">
                              <span className="font-bold">•</span>
                              <span>{les}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Due Diligence Checklist */}
                      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2">
                        <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                          <Search className="w-3.5 h-3.5 text-indigo-600" />
                          Due Diligence Checklist
                        </h4>
                        <ul className="space-y-1.5">
                          {currentCase.investorChecklist.map((chk, cIdx) => (
                            <li key={cIdx} className="text-[11px] text-slate-700 flex items-start gap-1.5 leading-relaxed font-medium">
                              <span className="font-bold text-indigo-600">✓</span>
                              <span>{chk}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Pitfalls to Avoid */}
                      <div className="bg-rose-50/60 border border-rose-200 rounded-2xl p-4 space-y-2">
                        <h4 className="text-xs font-black text-rose-950 uppercase tracking-wider flex items-center gap-1.5">
                          <X className="w-3.5 h-3.5 text-rose-600" />
                          Common Pitfalls to Avoid
                        </h4>
                        <ul className="space-y-1.5">
                          {currentCase.pitfallsToAvoid.map((pit, pIdx) => (
                            <li key={pIdx} className="text-[11px] text-rose-900 flex items-start gap-1.5 leading-relaxed font-medium">
                              <span className="font-bold text-rose-600">⚠</span>
                              <span>{pit}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {/* Mentor Verdict Summary */}
                    <div className="p-4 sm:p-5 rounded-2xl bg-slate-900 text-white border border-slate-800 space-y-1.5">
                      <div className="flex items-center gap-2">
                        <Award className="w-4 h-4 text-amber-400" />
                        <h4 className="text-xs font-black uppercase tracking-wider text-amber-400">
                          Mentor's Final Compounding Verdict
                        </h4>
                      </div>
                      <p className="text-xs sm:text-sm text-slate-200 font-medium leading-relaxed">
                        {currentCase.verdictSummary}
                      </p>
                    </div>

                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {activeSubTab === 'TAX_CENTRE' && (
        <TaxCentre
          onOpenLesson={(lessonId) => {
            const lesson = INITIAL_LESSONS.find((item) => item.id === lessonId);
            if (!lesson) return;
            setActiveSubTab('LESSONS');
            setLessonQuery('');
            handleSelectLesson(lesson);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        />
      )}

      {activeSubTab === 'HISTORICAL_EVENTS' && <HistoricalEventsLab />}

      {activeSubTab === 'PORTFOLIO_MODELS' && <PortfolioConstructionLab />}

      {/* VIEW 3: DALAL STREET JARGON BUSTER */}
      {activeSubTab === 'JARGON_BUSTER' && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-7 shadow-sm space-y-6">
          {/* Header Bar & Search */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-200 pb-5">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-slate-900 text-amber-300 flex items-center justify-center font-black">
                  <Zap className="w-4 h-4" />
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  Dalal Street Jargon Buster
                </h3>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
                Decode confusing stock market words into crystal-clear everyday investor concepts.
              </p>
            </div>

            {/* Search Input */}
            <div className="relative w-full lg:w-80">
              <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search term (e.g. Bull, P/E, IPO, Demat)..."
                value={jargonQuery}
                onChange={(e) => setJargonQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9.5 pr-8 py-2.5 text-xs text-slate-900 placeholder-slate-500/70 focus:outline-none focus:border-slate-900 focus:bg-white transition-all"
              />
              {jargonQuery && (
                <button
                  onClick={() => setJargonQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-500 hover:text-slate-900 rounded-full"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Category Filter Chips Bar */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1 shrink-0 mr-1">
              <Filter className="w-3 h-3 text-slate-900" /> Categories:
            </span>
            {jargonCategories.map((cat) => {
              const isActive = selectedJargonCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedJargonCategory(cat)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-extrabold whitespace-nowrap transition-all cursor-pointer ${
                    isActive
                      ? 'bg-slate-900 text-white shadow-xs dark:bg-indigo-600'
                      : 'bg-slate-50 text-slate-500 hover:text-slate-900 hover:bg-white border border-slate-200'
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>

          {/* Results Summary Bar */}
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 px-1">
            <span>Showing {filteredJargon.length} {filteredJargon.length === 1 ? 'definition' : 'definitions'}</span>
            {(jargonQuery || selectedJargonCategory !== 'ALL') && (
              <button
                onClick={() => {
                  setJargonQuery('');
                  setSelectedJargonCategory('ALL');
                }}
                className="text-amber-700 hover:text-amber-900 underline cursor-pointer"
              >
                Reset filters
              </button>
            )}
          </div>

          {/* Jargon Definitions Grid */}
          {filteredJargon.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-stretch">
              {filteredJargon.map((item, idx) => (
                <div 
                  key={idx} 
                  className="bg-slate-50 border border-slate-200 hover:border-slate-900 rounded-2xl p-5 hover:shadow-xs transition-all flex flex-col justify-between group"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-white text-slate-900 border border-slate-200">
                        {item.category}
                      </span>
                      <span className="text-[10px] font-mono font-bold text-slate-500">
                        #{idx + 1}
                      </span>
                    </div>
                    <h4 className="text-sm font-black text-slate-900 group-hover:text-amber-700 transition-colors">
                      {item.term}
                    </h4>
                    <p className="text-xs text-slate-600 mt-2 leading-relaxed font-medium">
                      {item.desc}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-200/60 flex items-center justify-between text-[10px] font-bold text-slate-500">
                    <span className="flex items-center gap-1 text-emerald-800">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Simplified for Teens
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-3">
              <BookOpen className="w-8 h-8 text-slate-500 mx-auto opacity-50" />
              <p className="text-sm font-bold text-slate-900">No matching terms found</p>
              <p className="text-xs text-slate-500">Try searching for different keywords or clear the category filters.</p>
              <button
                onClick={() => {
                  setJargonQuery('');
                  setSelectedJargonCategory('ALL');
                }}
                className="px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-xl cursor-pointer"
              >
                Clear Search
              </button>
            </div>
          )}
        </div>
      )}


      {/* VIEW 4: INVESTOR QUIZ */}
      {activeSubTab === 'DAILY_QUIZ' && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-slate-200 pb-4">
            <div>
              <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-slate-900" />
                Daily Investor Quiz
              </h3>
              <p className="text-xs text-slate-500 font-medium mt-1">
                Test your knowledge and earn Academy Points to level up!
              </p>
            </div>
            <div className="bg-indigo-600/10 border border-indigo-600/30 px-3 py-1.5 rounded-xl flex items-center gap-2">
              <Award className="w-4 h-4 text-indigo-600" />
              <span className="text-xs font-bold text-indigo-600">+50 XP per question</span>
            </div>
          </div>

          <div className="max-w-2xl mx-auto">
            {(() => {
              const q = QUIZ_QUESTIONS[activeQuizIndex];
              const isCompleted = completedLessonIds.includes(q.id);
              const hasAnswered = selectedAnswerIdx !== null || isCompleted;
              
              return (
                <div className="space-y-6">
                  {/* Progress Header */}
                  <div className="flex justify-between items-center text-xs font-bold text-slate-500">
                    <span>Question {activeQuizIndex + 1} of {QUIZ_QUESTIONS.length}</span>
                    <span className={isCompleted ? 'text-indigo-600' : ''}>
                      {isCompleted ? 'Completed ✓' : 'Pending'}
                    </span>
                  </div>

                  {/* Question */}
                  <h4 className="text-lg font-extrabold text-slate-900 leading-snug">
                    {q.question}
                  </h4>

                  {/* Options */}
                  <div className="space-y-3">
                    {q.options.map((opt, idx) => {
                      let btnStateClass = 'bg-slate-50 border-slate-200 text-slate-900 hover:border-slate-900 hover:bg-white';
                      
                      if (hasAnswered) {
                        if (idx === q.correctIndex) {
                          btnStateClass = 'bg-indigo-600/10 border-indigo-600 text-indigo-600 font-bold'; // Correct
                        } else if (idx === selectedAnswerIdx) {
                          btnStateClass = 'bg-rose-50 border-rose-300 text-rose-700'; // Incorrect pick
                        } else {
                          btnStateClass = 'bg-slate-50 border-slate-200 text-slate-500 opacity-60'; // Other
                        }
                      } else if (selectedAnswerIdx === idx) {
                        btnStateClass = 'bg-slate-900 border-slate-900 text-white dark:border-indigo-500 dark:bg-indigo-700'; // Selected (if we want to allow picking before submit, but let's just make it immediate)
                      }

                      return (
                        <button
                          key={idx}
                          disabled={isCompleted || selectedAnswerIdx !== null}
                          onClick={() => {
                            setSelectedAnswerIdx(idx);
                            if (idx === q.correctIndex) {
                              completeLesson(q.id, q.xp);
                            }
                          }}
                          className={`w-full text-left px-5 py-4 rounded-2xl border transition-all ${btnStateClass} ${hasAnswered ? 'cursor-default' : 'cursor-pointer'}`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-semibold">{opt}</span>
                            {hasAnswered && idx === q.correctIndex && <CheckCircle2 className="w-5 h-5 text-indigo-600" />}
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* Explanation & Next */}
                  {hasAnswered && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-slate-900 text-white p-5 rounded-2xl border border-slate-900/80 mt-6"
                    >
                      <h5 className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-2">
                        {selectedAnswerIdx === q.correctIndex || isCompleted ? 'Awesome! Correct Answer.' : 'Not quite right.'}
                      </h5>
                      <p className="text-sm font-medium leading-relaxed text-white">
                        {q.explanation}
                      </p>
                      
                      <div className="mt-5 flex justify-end">
                        <button
                          onClick={() => {
                            if (activeQuizIndex < QUIZ_QUESTIONS.length - 1) {
                              setActiveQuizIndex(activeQuizIndex + 1);
                              setSelectedAnswerIdx(null);
                            }
                          }}
                          disabled={activeQuizIndex >= QUIZ_QUESTIONS.length - 1}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                          Next Question <ArrowRight className="w-4 h-4" />
                        </button>
                      </div>
                    </motion.div>
                  )}
                </div>
              );
            })()}
          </div>
        </div>
      )}

    </div>
  );
};
