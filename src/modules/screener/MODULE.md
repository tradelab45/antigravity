# Screener

Advanced stock screening, benchmark indices, filter tokens and quick price alerts.

## Layout

### `components/`

- `MarketScreener.tsx` — moved from `src/components/MarketScreener.tsx`
- `QuickAlertModal.tsx` — moved from `src/components/QuickAlertModal.tsx`

### `data/`

- `benchmarkIndices.ts` — moved from `src/data/benchmarkIndices.ts`

### `constants/`

- `marketKeywords.ts` — moved from `src/constants/marketKeywords.ts`

### `server/`

- `screenerService.ts` — moved from `src/server/screenerService.ts`

## HTTP routes

Extracted from the `server.ts` monolith into `src/server/routes/screener.ts`:

- `/api/screener`

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
