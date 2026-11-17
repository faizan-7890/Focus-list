/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useEffect, useState } from 'react';

export type ThemePreference = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

export const THEME_STORAGE_KEY = 'focuslist_theme';

const THEME_ORDER: ThemePreference[] = ['light', 'dark', 'system'];

function readStoredPreference(): ThemePreference {
  try {
    const raw = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (raw === 'light' || raw === 'dark' || raw === 'system') {
      return raw;
    }
  } catch {
    // localStorage may be unavailable in sandboxed frames.
  }
  return 'system';
}

function prefersDark(): boolean {
  try {
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  } catch {
    return false;
  }
}

function resolveTheme(preference: ThemePreference): ResolvedTheme {
  if (preference === 'system') {
    return prefersDark() ? 'dark' : 'light';
  }
  return preference;
}

/**
 * Apply the resolved theme to <html>: toggles the `dark` class (which drives
 * every Tailwind `dark:` variant) and sets `color-scheme` so native widgets,
 * scrollbars and form controls match. Kept outside React so an inline boot
 * script in index.html can call the same logic before first paint (no FOUC).
 */
function applyResolvedTheme(resolved: ResolvedTheme): void {
  const root = document.documentElement;
  root.classList.toggle('dark', resolved === 'dark');
  root.style.colorScheme = resolved;
}

export interface UseThemeResult {
  preference: ThemePreference;
  resolved: ResolvedTheme;
  setPreference: (preference: ThemePreference) => void;
  /** Cycle light -> dark -> system -> light. */
  cyclePreference: () => void;
}

export function useTheme(): UseThemeResult {
  const [preference, setPreferenceState] = useState<ThemePreference>(() =>
    readStoredPreference()
  );
  const [resolved, setResolved] = useState<ResolvedTheme>(() =>
    resolveTheme(readStoredPreference())
  );

  // Apply + persist whenever the preference changes.
  useEffect(() => {
    const next = resolveTheme(preference);
    setResolved(next);
    applyResolvedTheme(next);
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, preference);
    } catch {
      // Non-fatal.
    }
  }, [preference]);

  // When following the system, react live to OS theme changes.
  useEffect(() => {
    if (preference !== 'system') return;
    let media: MediaQueryList;
    try {
      media = window.matchMedia('(prefers-color-scheme: dark)');
    } catch {
      return;
    }
    const handleChange = () => {
      const next = resolveTheme('system');
      setResolved(next);
      applyResolvedTheme(next);
    };
    media.addEventListener('change', handleChange);
    return () => media.removeEventListener('change', handleChange);
  }, [preference]);

  const setPreference = useCallback((next: ThemePreference) => {
    setPreferenceState(next);
  }, []);

  const cyclePreference = useCallback(() => {
    setPreferenceState((prev) => {
      const idx = THEME_ORDER.indexOf(prev);
      return THEME_ORDER[(idx + 1) % THEME_ORDER.length];
    });
  }, []);

  return { preference, resolved, setPreference, cyclePreference };
}
