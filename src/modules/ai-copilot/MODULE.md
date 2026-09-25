# Chanakya AI Copilot

Gemini-backed mentor chat, portfolio audit, stock analysis and the market pulse/news feeds.

## Layout

### `components/`

- `ChanakyaMentor.tsx` — moved from `src/components/ChanakyaMentor.tsx`
- `ChanakyaCopilotBanner.tsx` — moved from `src/components/ChanakyaCopilotBanner.tsx`

## HTTP routes

Extracted from the `server.ts` monolith into `src/server/routes/ai-copilot.ts`:

- `/api/gemini`
- `/api/market-pulse`
- `/api/market-news`

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
