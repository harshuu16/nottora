import { useState, useEffect, useCallback } from 'react';

export type ThemeMode = 'light' | 'dark';
export type ResolvedTheme = 'light' | 'dark';

export const THEME_STORAGE_KEY = 'nottora-theme-preference';

/**
 * Reads stored theme choice from localStorage ('light' | 'dark').
 * Defaults to 'light'.
 */
export function getStoredThemePreference(): ThemeMode {
  if (typeof window === 'undefined') return 'light';
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === 'dark') {
      return 'dark';
    }
    if (stored === 'light') {
      return 'light';
    }
  } catch {
    // ignore
  }
  return 'light';
}

/**
 * Resolves a ThemeMode to an actual active 'light' or 'dark' state.
 */
export function resolveTheme(mode: ThemeMode): ResolvedTheme {
  return mode === 'dark' ? 'dark' : 'light';
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
    localStorage.setItem(THEME_STORAGE_KEY, mode);
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

  // Handle initial mount application & storage changes across tabs
  useEffect(() => {
    const initialResolved = applyTheme(themeMode);
    setResolvedTheme(initialResolved);

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

