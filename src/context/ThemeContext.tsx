import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

export type ThemeMode = 'light' | 'dark';

/**
 * Background palettes. Each palette only re-tints the page canvas (and the soft
 * gradients layered on it) so card, text and status colours keep their tested
 * contrast in both light and dark mode.
 */
export type ThemePalette =
  | 'classic'
  | 'midnight'
  | 'forest'
  | 'sunrise'
  | 'ocean'
  | 'plum'
  | 'mono';

export interface PaletteOption {
  id: ThemePalette;
  label: string;
  description: string;
  /** Swatch shown in the picker: [light canvas, dark canvas, accent] */
  swatch: [string, string, string];
}

export const THEME_PALETTES: PaletteOption[] = [
  { id: 'classic', label: 'Classic Slate', description: 'The original cool grey canvas.', swatch: ['#f8fafc', '#030712', '#4f46e5'] },
  { id: 'midnight', label: 'Midnight Indigo', description: 'Deep indigo, easy on the eyes at night.', swatch: ['#f1f3fb', '#080c1f', '#6366f1'] },
  { id: 'forest', label: 'Forest Mint', description: 'Calm green canvas for long study sessions.', swatch: ['#f1f8f3', '#04140d', '#059669'] },
  { id: 'sunrise', label: 'Sunrise Sand', description: 'Warm paper tone that reduces glare.', swatch: ['#fdf7ef', '#191207', '#d97706'] },
  { id: 'ocean', label: 'Ocean Teal', description: 'Cool teal, high clarity for charts.', swatch: ['#eef8fb', '#04161c', '#0891b2'] },
  { id: 'plum', label: 'Plum Berry', description: 'Soft violet with a warm contrast.', swatch: ['#faf1f8', '#170a18', '#a21caf'] },
  { id: 'mono', label: 'Pure Mono', description: 'Maximum contrast: pure white or pure black.', swatch: ['#ffffff', '#000000', '#111827'] },
];

interface ThemeContextType {
  theme: ThemeMode;
  isDark: boolean;
  toggleTheme: () => void;
  setTheme: (theme: ThemeMode) => void;
  palette: ThemePalette;
  setPalette: (palette: ThemePalette) => void;
  palettes: PaletteOption[];
}

const STORAGE_KEY = 'rupeeRookie_theme';
const PALETTE_STORAGE_KEY = 'rupeeRookie_palette';

const isPalette = (value: unknown): value is ThemePalette =>
  typeof value === 'string' && THEME_PALETTES.some((option) => option.id === value);

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<ThemeMode>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) || localStorage.getItem('tradeLab_theme');
      if (saved === 'dark' || saved === 'light') {
        return saved;
      }
      if (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return 'dark';
      }
    } catch {
      // Ignore localStorage errors
    }
    return 'light';
  });

  const [palette, setPaletteState] = useState<ThemePalette>(() => {
    try {
      const saved = localStorage.getItem(PALETTE_STORAGE_KEY);
      if (isPalette(saved)) return saved;
    } catch {
      // Ignore localStorage errors
    }
    return 'classic';
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      // Ignore localStorage errors
    }

    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      root.style.colorScheme = 'dark';
    } else {
      root.classList.remove('dark');
      root.style.colorScheme = 'light';
    }
  }, [theme]);

  useEffect(() => {
    try {
      localStorage.setItem(PALETTE_STORAGE_KEY, palette);
    } catch {
      // Ignore localStorage errors
    }
    document.documentElement.dataset.rrPalette = palette;
  }, [palette]);

  const value = useMemo<ThemeContextType>(() => ({
    theme,
    isDark: theme === 'dark',
    toggleTheme: () => setThemeState((prev) => (prev === 'light' ? 'dark' : 'light')),
    setTheme: (newTheme: ThemeMode) => setThemeState(newTheme),
    palette,
    setPalette: (next: ThemePalette) => setPaletteState(next),
    palettes: THEME_PALETTES,
  }), [palette, theme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
