# Landing

Public landing pages, the 3D/spatial variant and the marketing footer.

## Layout

### `components/`

- `LandingPage.tsx` — moved from `src/components/LandingPage.tsx`
- `LandingPage3D.tsx` — moved from `src/components/LandingPage3D.tsx`
- `MotionFooter.tsx` — moved from `src/components/MotionFooter.tsx`
- `landing.css` — moved from `src/components/landing.css`
- `landing-3d.css` — moved from `src/components/landing-3d.css`

## Shared code this module depends on

These stay outside the module on purpose — they are used by most other modules
too, and moving them would make the `module/*` branches conflict with each
other. See `MODULE_MAP.md` for the full shared list.

- `src/types.ts` — app-wide types
- `src/context/SimulatorContext.tsx` — global simulator state
- `src/utils/formatters.ts` — currency and number formatting
- `src/components/ui/*`, `lib/utils.ts` — design-system primitives
