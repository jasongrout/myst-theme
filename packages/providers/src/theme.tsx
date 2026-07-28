import React from 'react';
import { validateRenderers, type NodeRenderers, type NodeRenderersValidated } from './renderers.js';
import { Theme, ThemePreference } from '@myst-theme/common';

export { Theme, ThemePreference };

export type LinkProps = {
  to: string;
  prefetch?: 'intent' | 'render' | 'none';
  title?: string;
  className?: string;
  children: React.ReactNode;
  onClick?: () => void;
  suppressHydrationWarning?: boolean;
  target?: string;
};

export type NavLinkProps = Omit<LinkProps, 'className'> & {
  className?: string | ((opts: { isActive: boolean }) => string);
};

export type Link = (props: LinkProps) => React.JSX.Element;
export type NavLink = (props: NavLinkProps) => React.JSX.Element;

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function HtmlLink({ to, className, children, prefetch, ...props }: LinkProps) {
  return (
    <a href={to} className={className} {...props}>
      {children}
    </a>
  );
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function HtmlNavLink({ to, className, children, prefetch, ...props }: NavLinkProps) {
  const staticClass = typeof className === 'function' ? className({ isActive: false }) : className;
  return (
    <a href={to} className={staticClass} {...props}>
      {children}
    </a>
  );
}

export function isTheme(value: unknown): value is Theme {
  return typeof value === 'string' && Object.values(Theme).includes(value as Theme);
}

export function isThemePreference(value: unknown): value is ThemePreference {
  return (
    typeof value === 'string' && Object.values(ThemePreference).includes(value as ThemePreference)
  );
}

/**
 * The theme preference cycle used by the theme switcher button:
 * system → light → dark → system. An unknown preference is treated as system.
 */
export function nextThemePreference(preference: ThemePreference | null): ThemePreference {
  switch (preference) {
    case ThemePreference.light:
      return ThemePreference.dark;
    case ThemePreference.dark:
      return ThemePreference.system;
    default:
      return ThemePreference.light;
  }
}

type SetThemeType = (preference: ThemePreference) => void;

type ThemeContextType = {
  theme: Theme | null;
  preference?: ThemePreference | null;
  setTheme: SetThemeType;
  renderers?: NodeRenderersValidated;
  top?: number;
  Link?: Link;
  NavLink?: NavLink;
  navigate?: (to: string) => void;
};

const ThemeContext = React.createContext<ThemeContextType | undefined>(undefined);
ThemeContext.displayName = 'ThemeContext';

export function ThemeProvider({
  theme,
  preference,
  setTheme,
  children,
  renderers,
  Link,
  NavLink,
  navigate,
  top,
}: {
  theme: Theme | null;
  preference?: ThemePreference | null;
  setTheme: SetThemeType;
  children: React.ReactNode;
  renderers?: NodeRenderers;
  Link?: Link;
  NavLink?: NavLink;
  navigate?: (to: string) => void;
  top?: number;
}) {
  const validatedRenderers = validateRenderers(renderers);

  return (
    <ThemeContext.Provider
      value={{
        theme,
        preference,
        setTheme,
        renderers: validatedRenderers,
        Link,
        NavLink,
        navigate,
        top,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useThemeSwitcher() {
  const context = React.useContext(ThemeContext);
  if (context === undefined) {
    const error = 'useThemeSwitcher should be used within a ThemeProvider';
    const throwError = () => {
      throw new Error(error);
    };
    // Just log an error if the theme is asked for
    console.error(error);
    return {
      theme: Theme.light,
      preference: ThemePreference.light,
      isLight: true,
      isDark: false,
      isSystem: false,
      setTheme: throwError,
      nextTheme: throwError,
    };
  }
  const { theme, preference = null, setTheme } = context;
  const isDark = theme === Theme.dark;
  const isLight = theme === Theme.light;
  const isSystem = preference === ThemePreference.system;
  const nextTheme = React.useCallback(() => {
    setTheme(nextThemePreference(preference));
  }, [preference, setTheme]);
  return { theme, preference, isLight, isDark, isSystem, setTheme, nextTheme };
}

export function useNodeRenderers(): NodeRenderersValidated {
  const context = React.useContext(ThemeContext);
  const { renderers } = context ?? {};
  return renderers ?? {};
}

export function useLinkProvider(): Link {
  const context = React.useContext(ThemeContext);
  const { Link } = context ?? {};
  return Link ?? HtmlLink;
}

export function useNavLinkProvider(): NavLink {
  const context = React.useContext(ThemeContext);
  const { NavLink } = context ?? {};
  return NavLink ?? HtmlNavLink;
}

export function useNavigateProvider(): (to: string) => void {
  const context = React.useContext(ThemeContext);
  const { navigate } = context ?? {};
  return (
    navigate ??
    ((to: string) => {
      window.location.href = to;
    })
  );
}

export function useThemeTop(): number {
  const context = React.useContext(ThemeContext);
  const { top } = context ?? {};
  return top || 0;
}
