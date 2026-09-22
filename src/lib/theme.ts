import { useState, useEffect, useCallback } from 'react';

export type ThemeMode = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

export const THEME_STORAGE_KEY = 'nottora-theme-preference';

/**
 * Returns the active system theme preference ('light' | 'dark').
 */
export function getSystemTheme(): ResolvedTheme {
  if (typeof window === 'undefined') return 'light';
  try {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  } catch {
    return 'light';
  }
}

/**
 * Reads stored theme choice from localStorage ('light' | 'dark' | 'system').
 * Defaults to 'system'.
 */
export function getStoredThemePreference(): ThemeMode {
  if (typeof window === 'undefined') return 'system';
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === 'light' || stored === 'dark' || stored === 'system') {
      return stored;
    }
  } catch {
    // ignore
  }
  return 'system';
}

/**
 * Resolves a ThemeMode to an actual active 'light' or 'dark' state.
 */
export function resolveTheme(mode: ThemeMode): ResolvedTheme {
  if (mode === 'system') {
    return getSystemTheme();
  }
  return mode;
}

/**
 * Applies the resolved theme to documentElement class, data-theme and colorScheme.
 */
export function applyTheme(mode: ThemeMode): ResolvedTheme {
  if (typeof document === 'undefined') return 'light';

  const resolved = resolveTheme(mode);
  const root = document.documentElement;

  if (resolved === 'dark') {
    root.classList.add('dark');
    root.classList.remove('light');
    root.setAttribute('data-theme', 'dark');
    root.style.colorScheme = 'dark';
  } else {
    root.classList.remove('dark');
    root.classList.add('light');
    root.setAttribute('data-theme', 'light');
    root.style.colorScheme = 'light';
  }

  return resolved;
}

/**
 * Saves preference to localStorage and applies it.
 */
export function setStoredThemePreference(mode: ThemeMode): ResolvedTheme {
  try {
    if (mode === 'system') {
      localStorage.setItem(THEME_STORAGE_KEY, 'system');
    } else {
      localStorage.setItem(THEME_STORAGE_KEY, mode);
    }
  } catch {
    // ignore
  }
  return applyTheme(mode);
}

/**
 * Custom React hook for theme management.
 */
export function useTheme() {
  const [themeMode, setThemeModeState] = useState<ThemeMode>(() => getStoredThemePreference());
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>(() => resolveTheme(getStoredThemePreference()));

  const setThemeMode = useCallback((mode: ThemeMode) => {
    setThemeModeState(mode);
    const resolved = setStoredThemePreference(mode);
    setResolvedTheme(resolved);
  }, []);

  const toggleTheme = useCallback(() => {
    // If currently dark, switch to light; if currently light, switch to dark
    const nextTheme: ThemeMode = resolvedTheme === 'dark' ? 'light' : 'dark';
    setThemeMode(nextTheme);
  }, [resolvedTheme, setThemeMode]);

  // Handle system preference changes & storage changes
  useEffect(() => {
    // Initial application on mount
    const initialResolved = applyTheme(themeMode);
    setResolvedTheme(initialResolved);

    // Media query listener for OS changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleMediaChange = () => {
      const currentPref = getStoredThemePreference();
      if (currentPref === 'system') {
        const newResolved = applyTheme('system');
        setResolvedTheme(newResolved);
      }
    };

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleMediaChange);
    } else {
      mediaQuery.addListener(handleMediaChange);
    }

    // Storage listener across tabs
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === THEME_STORAGE_KEY) {
        const newPref = getStoredThemePreference();
        setThemeModeState(newPref);
        const resolved = applyTheme(newPref);
        setResolvedTheme(resolved);
      }
    };
    window.addEventListener('storage', handleStorageChange);

    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleMediaChange);
      } else {
        mediaQuery.removeListener(handleMediaChange);
      }
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [themeMode]);

  return {
    themeMode,
    resolvedTheme,
    setThemeMode,
    toggleTheme,
    isDark: resolvedTheme === 'dark',
  };
}

