# Portfolio

Holdings, watchlist, risk heatmap, construction lab, thematic baskets and performance attribution.

## Layout

### `components/`

- `PortfolioHub.tsx` — moved from `src/components/PortfolioHub.tsx`
- `PortfolioView.tsx` — moved from `src/components/PortfolioView.tsx`
- `PortfolioReportModal.tsx` — moved from `src/components/PortfolioReportModal.tsx`
- `PortfolioConstructionLab.tsx` — moved from `src/components/PortfolioConstructionLab.tsx`
- `WatchlistView.tsx` — moved from `src/components/WatchlistView.tsx`
- `RiskCenterModal.tsx` — moved from `src/components/RiskCenterModal.tsx`
- `ThematicBasketsModal.tsx` — moved from `src/components/ThematicBasketsModal.tsx`

### `utils/`

- `attribution.ts` — moved from `src/utils/attribution.ts`

## Shared code this module depends on

These stay outside the module on purpose — they are used by most other modules
too, and moving them would make the `module/*` branches conflict with each
other. See `MODULE_MAP.md` for the full shared list.

- `src/types.ts` — app-wide types
- `src/context/SimulatorContext.tsx` — global simulator state
- `src/utils/formatters.ts` — currency and number formatting
- `src/components/ui/*`, `lib/utils.ts` — design-system primitives
