# Tax & Calculators

Tax centre, taxation lessons and the inflation/tax-aware compound calculator.

## Layout

### `components/`

- `TaxCentre.tsx` — moved from `src/components/TaxCentre.tsx`
- `CompoundCalculator.tsx` — moved from `src/components/CompoundCalculator.tsx`

### `data/`

- `taxationLessons.ts` — moved from `src/data/taxationLessons.ts`

## Shared code this module depends on

These stay outside the module on purpose — they are used by most other modules
too, and moving them would make the `module/*` branches conflict with each
other. See `MODULE_MAP.md` for the full shared list.

- `src/types.ts` — app-wide types
- `src/context/SimulatorContext.tsx` — global simulator state
- `src/utils/formatters.ts` — currency and number formatting
- `src/components/ui/*`, `lib/utils.ts` — design-system primitives
