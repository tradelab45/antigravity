# Market Data

Upstox/Yahoo/Google Finance feeds, the stock catalogue, quotes, indices, options chain and technical calculations.

## Layout

### `components/`

- `StockDetailModal.tsx` — moved from `src/components/StockDetailModal.tsx`
- `IndianStockApiModal.tsx` — moved from `src/components/IndianStockApiModal.tsx`
- `IPOView.tsx` — moved from `src/components/IPOView.tsx`
- `OptionsChainModal.tsx` — moved from `src/components/OptionsChainModal.tsx`
- `BigQueryGraphView.tsx` — moved from `src/components/BigQueryGraphView.tsx`

### `data/`

- `indianCompanies.ts` — moved from `src/data/indianCompanies.ts`
- `psuStocks.ts` — moved from `src/data/psuStocks.ts`

### `utils/`

- `quoteState.ts` — moved from `src/utils/quoteState.ts`
- `marketHours.ts` — moved from `src/utils/marketHours.ts`
- `indexCalculator.ts` — moved from `src/utils/indexCalculator.ts`
- `technicalCalculator.ts` — moved from `src/utils/technicalCalculator.ts`
- `optionsCalculator.ts` — moved from `src/utils/optionsCalculator.ts`

### `server/`

- `upstoxService.ts` — moved from `src/server/upstoxService.ts`
- `googleFinanceService.ts` — moved from `src/server/googleFinanceService.ts`
- `stockCatalog.ts` — moved from `src/server/stockCatalog.ts`

## HTTP routes

Extracted from the `server.ts` monolith into `src/server/routes/market-data.ts`:

- `/api/stocks`
- `/api/upstox`
- `/api/indian-stock-api`
- `/api/google-finance`
- `/api/market/stream`
- `/api/market/summary`

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
