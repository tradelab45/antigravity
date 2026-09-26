import { useCallback } from 'react';
import { useAccessibility } from '../context/AccessibilityContext';
import { translate, type UiStringKey } from './strings';

/**
 * `const t = useTranslation();` then `t('nav.home')`.
 *
 * The language comes from the same `learningLanguage` setting the Academy
 * already uses, so one choice in the accessibility panel moves the whole app
 * rather than only the lesson text.
 */
export function useTranslation(): (key: UiStringKey) => string {
  const { settings } = useAccessibility();
  return useCallback(
    (key: UiStringKey) => translate(key, settings.learningLanguage),
    [settings.learningLanguage],
  );
}
