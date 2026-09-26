// Public surface of the Accessibility module.
// See MODULE.md for what this module owns and what it borrows from shared code.

export { AccessibilityCenter } from './components/AccessibilityCenter';
export { AccessibilityProvider, useAccessibility } from './context/AccessibilityContext';
export type { AccessibilitySettings, LearningLanguage } from './context/AccessibilityContext';
