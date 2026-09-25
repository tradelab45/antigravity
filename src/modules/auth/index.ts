// Public surface of the Authentication module.
// See MODULE.md for what this module owns and what it borrows from shared code.

export { AuthLaunchTransition } from './components/AuthLaunchTransition';
export { AuthModal } from './components/AuthModal';
export { AuthPage } from './components/AuthPage';
export { CompleteProfileModal } from './components/CompleteProfileModal';
export { DataPrivacyCenter } from './components/DataPrivacyCenter';
export { ProfileCard } from './components/ProfileCard';
export type { ProfileCardProps } from './components/ProfileCard';
export { AuthOrDivider, FALLBACK_GOOGLE_CLIENT_ID, GoogleSignInButton } from './components/GoogleSignInButton';
export { isAuthApiRejection, validateEmail, validateUsername } from './authResponse';
