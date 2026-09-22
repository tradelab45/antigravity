export interface StockDetail {
  corporateActions?: any;
  symbol: string;
  name: string;
  sector: string;
  price: number;
  change: number;
  changePercent: number;
  dayHigh: number;
  dayLow: number;
  open: number;
  previousClose: number;
  high52: number;
  low52: number;
  peRatio: number;
  industryPe: number;
  marketCapCr: number;
  eps: number;
  dividendYield: number;
  bookValue: number;
  roe: number;
  volume: number;
  avgVolume: number;
  beta: number;
  description: string;
  teenSummary: string;
  popularBrands: string[];
  strengths: string[];
  risks: string[];
  quoteSource?: string;
  quoteAsOf?: string;
  quoteTicker?: string;
  quoteStatus?: 'live' | 'delayed' | 'simulated';
  isGovernmentOwned?: boolean;
  psuStatus?: 'Maharatna' | 'Navratna' | 'Miniratna' | 'PSU Bank' | 'Defence PSU' | 'Railway PSU' | 'Govt Owned';
  ministry?: string;
  // Technical indicator indicators for screeners
  ema20?: number;
  ema50?: number;
  ema200?: number;
  rsi14?: number;
  bollingerUpper?: number;
  bollingerLower?: number;
  bollingerMiddle?: number;
  // DuPont Analysis Breakdown: ROE = Net Profit Margin * Asset Turnover * Equity Multiplier (Financial Leverage)
  dupontAnalysis?: {
    netProfitMarginPercent: number;
    assetTurnoverRatio: number;
    equityMultiplier: number;
    calculatedRoe: number;
    verdict: string;
  };
  // Quarterly Financial Performance
  quarterlyResults?: {
    quarter: string;
    revenueCr: number;
    patCr: number; // Profit After Tax
    ebitdaMarginPercent: number;
  }[];
}

export type ProductType = 'CNC' | 'MIS'; // CNC = Delivery (1x), MIS = Intraday (5x leverage)

export interface Holding {
  symbol: string;
  quantity: number;
  avgBuyPrice: number;
  totalInvested: number;
  productType?: ProductType;
  buyDate?: string;
  isLongTerm?: boolean; // > 365 days for LTCG tax calculation
}

export interface BracketOrderParams {
  stopLossPrice?: number;
  targetPrice?: number;
  targetProfitPrice?: number;
  stopLossPercent?: number;
  targetPercent?: number;
  stopLossPct?: number;
  targetProfitPct?: number;
  trailingStopLoss?: number;
}

export interface Order {
  id: string;
  symbol: string;
  stockName: string;
  type: 'BUY' | 'SELL';
  orderType: 'MARKET' | 'LIMIT' | 'GTT';
  productType: ProductType;
  quantity: number;
  price: number;
  totalAmount: number;
  marginUsed?: number;
  timestamp: string;
  status: 'EXECUTED' | 'PENDING' | 'CANCELLED' | 'TRIGGERED';
  isAMO?: boolean;
  executionTime?: string;
  placedTimeIST?: string;
  bracketOrder?: BracketOrderParams;
  gttTriggerPrice?: number;
  gttCondition?: 'ABOVE' | 'BELOW';
  notes?: string;
  // Closed position P&L tracking
  realizedPnL?: number;
  realizedPnLPercent?: number;
  buyAvgPrice?: number;
  closedAt?: string;
  exitReason?: 'TARGET_HIT' | 'STOP_LOSS_HIT' | 'MANUAL_EXIT' | 'SQUARE_OFF';
  charges?: number;
  rMultiple?: number;
  holdTime?: string;
}

export interface WatchlistGroup {
  id: string;
  name: string;
  symbols: string[];
  isCustom?: boolean;
  createdAt?: string;
}

export interface OptionContract {
  strikePrice: number;
  expiryDate: string;
  underlyingSymbol: 'NIFTY' | 'BANKNIFTY';
  ceLtp: number;
  ceChange: number;
  ceChangePercent: number;
  ceOi: number;
  ceVolume: number;
  ceIv: number;
  ceDelta: number;
  ceGamma: number;
  ceTheta: number;
  ceVega: number;
  peLtp: number;
  peChange: number;
  peChangePercent: number;
  peOi: number;
  peVolume: number;
  peIv: number;
  peDelta: number;
  peGamma: number;
  peTheta: number;
  peVega: number;
}

export interface OptionPosition {
  id: string;
  underlying: 'NIFTY' | 'BANKNIFTY';
  optionType: 'CE' | 'PE';
  strikePrice: number;
  expiryDate: string;
  contracts: number; // Lot size: 75 for Nifty, 30 for BankNifty
  avgPrice: number;
  currentLtp: number;
  action: 'BUY' | 'SELL';
  investedAmount: number;
  currentValue: number;
  pnl: number;
  pnlPercent: number;
  openedAt: string;
}

export interface TradingLeagueParticipant {
  rank: number;
  username: string;
  fullName: string;
  avatarBg: string;
  weeklyPnL: number;
  weeklyPnLPercent: number;
  winRate: number;
  totalTrades: number;
  badge: string;
  isCurrentUser?: boolean;
}

export interface PortfolioSnapshot {
  timestamp: string;
  timeLabel: string;
  portfolioValue: number;
  investedValue: number;
  cashBalance: number;
  totalPnL: number;
}

export interface MarketIndices {
  nifty50: { name: string; value: number; change: number; changePercent: number };
  sensex: { name: string; value: number; change: number; changePercent: number };
  niftyBank: { name: string; value: number; change: number; changePercent: number };
  niftyIT: { name: string; value: number; change: number; changePercent: number };
}

export interface MarketNews {
  id: string;
  headline: string;
  source: string;
  time: string;
  tag: string;
  sentiment: string;
}

export interface LessonQuizOption {
  id: string;
  text: string;
  isCorrect: boolean;
  explanation: string;
}

export interface LessonQuiz {
  question: string;
  options: LessonQuizOption[];
}

export interface Lesson {
  id: string;
  title: string;
  tagline: string;
  category: string;
  readTime: string;
  xpReward: number;
  iconName: string;
  summary: string;
  sections: {
    heading: string;
    content: string;
    exampleBox?: {
      title: string;
      description: string;
      analogy: string;
    };
  }[];
  keyTakeaways: string[];
  quiz: LessonQuiz;
}

export interface Badge {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlockedAt?: string;
  category: 'TRADING' | 'LEARNING' | 'PORTFOLIO' | 'WEALTH';
  xpReward?: number;
}

export interface Alert {
  id: string;
  symbol: string;
  targetPrice?: number;
  type: 'ABOVE' | 'BELOW';
  kind?: 'PRICE' | 'EARNINGS' | 'WEEK_52' | 'MOVE_PERCENT' | 'PE_CHANGE' | 'SECTOR_CONCENTRATION' | 'DRAWDOWN';
  threshold?: number;
  eventDate?: string;
  reason?: string;
  lessonTitle?: string;
  baselineValue?: number;
  sector?: string;
  active: boolean;
  createdAt: string;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ALERT';
  timestamp: string;
  read: boolean;
  symbol?: string;
}

export interface UserAccount {
  id: string;
  fullName: string;
  email: string;
  username: string;
  phone?: string;
  ageGroup?: string;
  experienceLevel: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  initialCapital: number;
  registeredAt: string;
  lastLoginAt: string;
  portfolioValue?: number;
  totalTrades?: number;
  isAdmin?: boolean;
  role?: 'ADMIN' | 'USER';
}

export interface BroadcastAnnouncement {
  id: string;
  title?: string;
  message: string;
  type: 'INFO' | 'ALERT' | 'SUCCESS' | 'WARNING';
  timestamp: string;
  active?: boolean;
}


export interface AuthFormData {
  fullName: string;
  email: string;
  username: string;
  password: string;
  phone?: string;
  ageGroup?: string;
  experienceLevel: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
}

// ----------------------------------------------------
// RUPEEROOKIE CORE TYPES (Pillars & Masterplan)
// ----------------------------------------------------

export interface TraderDNA {
  momentum: number; // 0-100
  discipline: number; // 0-100
  riskControl: number; // 0-100
  timing: number; // 0-100
  patience: number; // 0-100
  consistency: number; // 0-100
  adaptability: number; // 0-100
  strategyClarity: number; // 0-100
  archetype: string; // e.g. "Disciplined Momentum Trader", "Risk-Averse Value Scalper"
  strength: string;
  weakness: string;
  bestConditions: string;
  worstConditions: string;
}

export type SkillRank = 'Rookie' | 'Bronze' | 'Silver' | 'Gold' | 'Platinum' | 'Elite';

export interface SkillScoreBreakdown {
  overallScore: number; // 0-1000
  rank: SkillRank;
  riskControl: number; // 25%
  consistency: number; // 20%
  execution: number; // 15%
  drawdownControl: number; // 15%
  strategyAdherence: number; // 10%
  riskAdjustedReturn: number; // 10%
  learningCompletion: number; // 5%
  nextRankThreshold: number;
}

export type SimAccountType = 'INTRADAY' | 'OPTIONS' | 'POSITIONAL' | 'CHALLENGE' | 'CUSTOM';

export interface SimAccount {
  id: string;
  name: string;
  type: SimAccountType;
  initialCapital: number;
  cashBalance: number;
  allocatedMargin: number;
  description: string;
  createdAt: string;
}

export interface TradeJournalEntry {
  id: string;
  orderId: string;
  symbol: string;
  side: 'BUY' | 'SELL';
  productType: ProductType;
  quantity: number;
  plannedEntry: number;
  actualEntry: number;
  plannedStopLoss?: number;
  actualExit?: number;
  plannedTarget?: number;
  pnl: number;
  pnlPercent: number;
  mfe: number; // Max Favorable Excursion (%)
  mae: number; // Max Adverse Excursion (%)
  rMultiple: number; // e.g. +1.7R or -1.0R
  slippage: number;
  charges: number;
  holdTimeMinutes: number;
  setup: string; // "Breakout", "Opening Range", "Mean Reversion", "VWAP Pullback", "Support Bounce"
  tags: ('Breakout' | 'VWAP' | 'Momentum' | 'Reversal' | 'FOMO' | 'Revenge' | 'Planned' | 'News' | 'Oversize')[];
  /** Empty until the trader records it; the simulator cannot infer a mood. */
  emotion: '' | 'Calm & Disciplined' | 'FOMO / Anxious' | 'Greedy' | 'Revenge / Frustrated' | 'Hesitant';
  executionScore: number; // 0-100
  riskScore: number; // 0-100
  disciplineScore: number; // 0-100
  ruleCompliance: boolean;
  aiFeedback: string;
  timestamp: string;
}

export interface ReplayCandle {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  rsi?: number;
  vwap?: number;
}

export interface ReplayScenario {
  id: string;
  title: string;
  category: 'Budget Day' | 'RBI Policy' | 'Election Shock' | 'Breakout Mastery' | 'Earnings Volatility' | 'Gap Day' | 'Expiry Zero-Hero';
  realSymbol: string;
  realDate: string;
  blindName: string; // e.g. "Asset X - MidCap Momentum"
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
  initialPrice: number;
  tagline: string;
  contextNarrative: string;
  historicalContext: string;
  candles: ReplayCandle[];
  keyLessons: string[];
}

export interface RiskSettings {
  maxDailyLoss: number; // in INR
  maxWeeklyLoss: number; // in INR
  maxPositionSizePct: number; // e.g. 10%
  maxTradesPerDay: number; // e.g. 5 trades
  mandatoryStopLoss: boolean;
  maxLeverage: number; // 1x to 5x
  cooldownActive: boolean;
  cooldownUntil?: string;
}

export interface BehaviorAnalytics {
  overtradingDetected: boolean;
  revengeTradingDetected: boolean;
  movingStopsDetected: boolean;
  prematureExitDetected: boolean;
  chaseEntryDetected: boolean;
  consecutiveLossStreak: number;
  avgPositionSizeAfterLossMultiplier: number;
  insights: string[];
}

export interface ChallengeItem {
  id: string;
  title: string;
  category: 'MONTHLY' | 'INTRADAY' | 'OPTIONS' | 'COLLEGE' | 'WEEKLY';
  initialCapital: number;
  startDate: string;
  endDate: string;
  participantsCount: number;
  status: 'ACTIVE' | 'UPCOMING' | 'COMPLETED';
  rules: string[];
  maxLeverage: string;
  scoringBasis: string;
  prizes: string;
  userRegistered: boolean;
}
