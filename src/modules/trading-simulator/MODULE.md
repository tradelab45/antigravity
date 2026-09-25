# Trading Simulator

Order entry, replay terminal, trade journal/review, challenges and head-to-head stock battles.

## Layout

### `components/`

- `OrderBookView.tsx` — moved from `src/components/OrderBookView.tsx`
- `ReplayTerminal.tsx` — moved from `src/components/ReplayTerminal.tsx`
- `TradeReviewHub.tsx` — moved from `src/components/TradeReviewHub.tsx`
- `TradingChallengesView.tsx` — moved from `src/components/TradingChallengesView.tsx`
- `StockBattleModal.tsx` — moved from `src/components/StockBattleModal.tsx`

### `data/`

- `replayData.ts` — moved from `src/data/replayData.ts`

## HTTP routes

Extracted from the `server.ts` monolith into `src/server/routes/trading-simulator.ts`:

- `/api/trades`

The router is created by a factory that receives the shared server state it
needs, so `server.ts` remains the single owner of that state.

## Shared code this module depends on

These stay outside the module on purpose — they are used by most other modules
too, and moving them would make the `module/*` branches conflict with each
other. See `MODULE_MAP.md` for the full shared list.

- `src/types.ts` — app-wide types
- `src/context/SimulatorContext.tsx` — global simulator state
- `src/utils/formatters.ts` — currency and number formatting
- `src/components/ui/*`, `lib/utils.ts` — design-system primitives
