# Authentication

Sign-up, sign-in, Google identity, profile completion, data-privacy centre and auth rate limiting.

## Layout

### `components/`

- `AuthPage.tsx` — moved from `src/components/AuthPage.tsx`
- `AuthModal.tsx` — moved from `src/components/AuthModal.tsx`
- `AuthLaunchTransition.tsx` — moved from `src/components/AuthLaunchTransition.tsx`
- `GoogleSignInButton.tsx` — moved from `src/components/GoogleSignInButton.tsx`
- `CompleteProfileModal.tsx` — moved from `src/components/CompleteProfileModal.tsx`
- `DataPrivacyCenter.tsx` — moved from `src/components/DataPrivacyCenter.tsx`

### `server/`

- `authRateLimit.ts` — moved from `src/server/authRateLimit.ts`

## HTTP routes

Extracted from the `server.ts` monolith into `src/server/routes/auth.ts`:

- `/api/auth`

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
