import React, { useEffect, useRef } from 'react';
import { Theme, ThemePreference } from '@myst-theme/common';
import { isThemePreference } from '@myst-theme/providers';
import { postThemeToAPI } from '../actions/theme.js';

export const PREFERS_LIGHT_MQ = '(prefers-color-scheme: light)';
export const THEME_LOCALSTORAGE_KEY = 'myst:theme';

/**
 * The system-preferred theme, from the `prefers-color-scheme` media query.
 * Returns `null` on the server, where the preference cannot be known.
 */
export function getPreferredTheme() {
  if (typeof window !== 'object') {
    return null;
  }
  const mediaQuery = window.matchMedia(PREFERS_LIGHT_MQ);
  return mediaQuery.matches ? Theme.light : Theme.dark;
}

/**
 * Hook that follows changes to the system-preferred theme.
 */
export function usePreferredTheme({ setTheme }: { setTheme: (theme: Theme | null) => void }) {
  useEffect(() => {
    const mediaQuery = window.matchMedia(PREFERS_LIGHT_MQ);
    const handleChange = () => {
      setTheme(mediaQuery.matches ? Theme.light : Theme.dark);
    };
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);
}

/**
 * Resolve a theme preference against the current system-preferred theme.
 */
function resolveTheme(preference: ThemePreference | null, systemTheme: Theme | null): Theme | null {
  switch (preference) {
    case ThemePreference.light:
      return Theme.light;
    case ThemePreference.dark:
      return Theme.dark;
    case ThemePreference.system:
      return systemTheme;
    default:
      return null;
  }
}

export function useTheme({
  ssrTheme,
  useLocalStorage,
}: {
  ssrTheme?: ThemePreference;
  useLocalStorage?: boolean;
}): [Theme | null, ThemePreference | null, (preference: ThemePreference) => void] {
  // Here, the initial state on the server without any set cookies will be null.
  // The client will then load the initial state as non-null.
  // Thus, we must mutate the DOM *pre-hydration* to ensure that the initial state is
  // identical to that of the hydrated state, i.e. perform out-of-react DOM updates
  // This is handled by the BlockingThemeLoader component.
  const [preference, setPreference] = React.useState<ThemePreference | null>(() => {
    if (isThemePreference(ssrTheme)) {
      return ssrTheme;
    }
    // On the server we can't know the saved preference, so leave it up to the client
    if (typeof window !== 'object') {
      return null;
    }
    // Local storage saved preference (static builds), otherwise follow the system
    const savedPreference = localStorage.getItem(THEME_LOCALSTORAGE_KEY);
    return useLocalStorage && isThemePreference(savedPreference)
      ? savedPreference
      : ThemePreference.system;
  });

  // Track the system-preferred theme; resolved in the initializer so that the
  // first client render matches the DOM patched by BlockingThemeLoader
  const [systemTheme, setSystemTheme] = React.useState<Theme | null>(getPreferredTheme);
  usePreferredTheme({ setTheme: setSystemTheme });

  // System changes only affect the applied theme when the preference is 'system';
  // an explicitly chosen theme is never overridden
  const theme = resolveTheme(preference, systemTheme);

  // Listen for changes to the preference, and propagate to server
  // This should be unidirectional; updates to the cookie do not trigger document rerenders
  const mountRun = useRef(false);
  useEffect(() => {
    // Only update after the component is mounted (i.e. don't send initial state)
    if (!mountRun.current) {
      mountRun.current = true;
      return;
    }
    if (!isThemePreference(preference)) {
      return;
    }
    if (useLocalStorage) {
      localStorage.setItem(THEME_LOCALSTORAGE_KEY, preference);
    } else {
      postThemeToAPI(preference);
    }
  }, [preference]);

  return [theme, preference, setPreference];
}
