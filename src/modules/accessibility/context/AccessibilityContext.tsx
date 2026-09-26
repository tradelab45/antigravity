import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

export type LearningLanguage = 'ENGLISH' | 'HINDI';

export interface AccessibilitySettings {
  textScale: 'SMALL' | 'DEFAULT' | 'LARGE' | 'XL';
  highContrast: boolean;
  reducedMotion: boolean;
  dyslexiaFriendly: boolean;
  learningLanguage: LearningLanguage;
  largeTouchTargets: boolean;
}

const DEFAULT_SETTINGS: AccessibilitySettings = {
  textScale: 'DEFAULT',
  highContrast: false,
  reducedMotion: false,
  dyslexiaFriendly: false,
  learningLanguage: 'ENGLISH',
  largeTouchTargets: true,
};

interface AccessibilityContextValue {
  settings: AccessibilitySettings;
  updateSetting: <K extends keyof AccessibilitySettings>(key: K, value: AccessibilitySettings[K]) => void;
  resetSettings: () => void;
}

const AccessibilityContext = createContext<AccessibilityContextValue | null>(null);

export function AccessibilityProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<AccessibilitySettings>(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('rr_accessibility_settings') || '{}');
      if (saved.learningLanguage === 'HINGLISH') saved.learningLanguage = 'HINDI';
      return { ...DEFAULT_SETTINGS, ...saved };
    } catch {
      return DEFAULT_SETTINGS;
    }
  });

  useEffect(() => {
    localStorage.setItem('rr_accessibility_settings', JSON.stringify(settings));
    const root = document.documentElement;
    root.dataset.rrText = settings.textScale.toLowerCase();
    root.dataset.rrContrast = String(settings.highContrast);
    root.dataset.rrMotion = settings.reducedMotion ? 'reduced' : 'full';
    root.dataset.rrDyslexia = String(settings.dyslexiaFriendly);
    root.dataset.rrTouch = String(settings.largeTouchTargets);
    root.lang = settings.learningLanguage === 'HINDI' ? 'hi-IN' : 'en-IN';
  }, [settings]);

  const value = useMemo(() => ({
    settings,
    updateSetting: <K extends keyof AccessibilitySettings>(key: K, value: AccessibilitySettings[K]) => {
      setSettings((previous) => ({ ...previous, [key]: value }));
    },
    resetSettings: () => setSettings(DEFAULT_SETTINGS),
  }), [settings]);

  return <AccessibilityContext.Provider value={value}>{children}</AccessibilityContext.Provider>;
}

export function useAccessibility() {
  const value = useContext(AccessibilityContext);
  if (!value) throw new Error('useAccessibility must be used within AccessibilityProvider');
  return value;
}
