// Public surface of the Trading Simulator module.
// See MODULE.md for what this module owns and what it borrows from shared code.

export { OrderBookView } from './components/OrderBookView';
export { ReplayTerminal } from './components/ReplayTerminal';
export { StockBattleModal } from './components/StockBattleModal';
export { TradeReviewHub } from './components/TradeReviewHub';
export type { TradeHistoryTransaction } from './components/TradeReviewHub';
export { TradingChallengesView } from './components/TradingChallengesView';
export { REPLAY_SCENARIOS } from './data/replayData';
