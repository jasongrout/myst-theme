import { THEME_LOCALSTORAGE_KEY, PREFERS_LIGHT_MQ } from '../hooks/theme.js';

/**
 * A blocking element that runs on the client before hydration to update the <html> preferred class
 * This ensures that the hydrated state matches the non-hydrated state (by updating the DOM on the
 * client between SSR on the server and hydration on the client)
 *
 * This must be rendered before any stylesheet <link> elements: inline scripts that follow
 * pending stylesheets wait for them to load, and this script must run before first paint.
 * Setting `style.colorScheme` here also gives the browser the correct default canvas and
 * form-control colors before any stylesheet has loaded, avoiding a flash of white in dark mode.
 */
export function BlockingThemeLoader({ useLocalStorage }: { useLocalStorage: boolean }) {
  const LOCAL_STORAGE_SOURCE = `localStorage.getItem(${JSON.stringify(THEME_LOCALSTORAGE_KEY)})`;
  const CLIENT_THEME_SOURCE = `
  const savedPreference = ${useLocalStorage ? LOCAL_STORAGE_SOURCE : 'null'};
  const explicit = savedPreference === 'light' || savedPreference === 'dark' ? savedPreference : null;
  const theme = explicit ?? (window.matchMedia(${JSON.stringify(PREFERS_LIGHT_MQ)}).matches ? 'light' : 'dark');
  const root = document.documentElement;
  const classes = root.classList;
  const hasAnyTheme = classes.contains('light') || classes.contains('dark');
  if (!hasAnyTheme) {
    classes.add(theme);
    root.style.colorScheme = theme;
  }
  if (!root.dataset.themePreference) root.dataset.themePreference = explicit ?? 'system';
`;

  return <script dangerouslySetInnerHTML={{ __html: CLIENT_THEME_SOURCE }} />;
}
