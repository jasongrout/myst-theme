import type { SiteManifest } from 'myst-config';
import type { SiteLoader } from '@myst-theme/common';
import type { NodeRenderers } from '@myst-theme/providers';
import {
  BaseUrlProvider,
  SiteProvider,
  ThemePreference,
  ThemeProvider,
  useThemeSwitcher,
} from '@myst-theme/providers';
import {
  Links,
  LiveReload,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
  Link,
  NavLink,
  useRouteError,
  isRouteErrorResponse,
  useNavigate,
} from '@remix-run/react';
import {
  DEFAULT_NAV_HEIGHT,
  renderers as defaultRenderers,
  BlockingThemeLoader,
} from '../components/index.js';
import { useTheme } from '../hooks/index.js';
import { Analytics } from '../seo/index.js';
import { Error404 } from './Error404.js';
import { ErrorUnhandled } from './ErrorUnhandled.js';
import classNames from 'classnames';

export function Document({
  children,
  scripts,
  theme: ssrTheme,
  config,
  title,
  staticBuild,
  baseurl,
  top = DEFAULT_NAV_HEIGHT,
  renderers = defaultRenderers,
  head,
}: {
  children: React.ReactNode;
  scripts?: React.ReactNode;
  theme?: ThemePreference;
  config?: SiteManifest;
  title?: string;
  staticBuild?: boolean;
  baseurl?: string;
  top?: number;
  renderers?: NodeRenderers;
  head?: React.ReactNode;
}) {
  const navigate = useNavigate();
  const links = staticBuild
    ? {
        Link: (props: any) => <Link {...{ ...props, reloadDocument: true }} />,
        NavLink: (props: any) => <NavLink {...{ ...props, reloadDocument: true }} />,
      }
    : {
        Link: Link as any,
        NavLink: NavLink as any,
        navigate,
      };

  // (Local) theme state driven by SSR and cookie/localStorage
  const [theme, preference, setTheme] = useTheme({ ssrTheme, useLocalStorage: staticBuild });

  // The server can only resolve an explicit light/dark preference; for an unknown or
  // 'system' preference, inject a blocking element to set proper pre-hydration state
  const ssrResolvable = ssrTheme === ThemePreference.light || ssrTheme === ThemePreference.dark;
  const themeLoader = ssrResolvable ? undefined : (
    <BlockingThemeLoader useLocalStorage={!!staticBuild} />
  );

  return (
    <ThemeProvider
      theme={theme}
      preference={preference}
      setTheme={setTheme}
      renderers={renderers}
      {...links}
      top={top}
    >
      <DocumentWithoutProviders
        children={children}
        scripts={scripts}
        head={head}
        themeLoader={themeLoader}
        config={config}
        title={title}
        liveReloadListener={!staticBuild}
        baseurl={baseurl}
        top={top}
      />
    </ThemeProvider>
  );
}

export function DocumentWithoutProviders({
  children,
  scripts,
  head,
  themeLoader,
  config,
  title,
  baseurl,
  top = DEFAULT_NAV_HEIGHT,
  liveReloadListener,
}: {
  children: React.ReactNode;
  scripts?: React.ReactNode;
  head?: React.ReactNode;
  themeLoader?: React.ReactNode;
  config?: SiteManifest;
  title?: string;
  baseurl?: string;
  useLocalStorageForDarkMode?: boolean;
  top?: number;
  liveReloadListener?: boolean;
}) {
  // Theme and preference come from the theme context. The stored value is a *preference*
  // (light, dark, or system); the resolved theme (light or dark) is applied as the html class,
  // and the preference is exposed as a data attribute for CSS (e.g. the theme button icons).
  //
  // For a clean page load (no cookies) or a saved 'system' preference, the server cannot resolve
  // the theme, so both theme and (on a clean load) preference are null during SSR, and the
  // BlockingThemeLoader injects the client-resolved theme (localStorage or media query) without
  // a FOUC. The loader must precede the stylesheet links: inline scripts that follow pending
  // stylesheets wait for them, and this must run before first paint. It also sets an inline
  // `color-scheme` style so the browser canvas is correct before any stylesheet loads.
  //
  // In live-server contexts, setting the theme preference updates the useThemeSwitcher context
  // state (re-rendering the html class/attributes) and posts the preference to the server cookie.
  // Upon the next request, an explicit light/dark preference is rendered during SSR and no
  // BlockingThemeLoader is injected.
  //
  // In static sites, the server can never resolve the theme, and the preference is saved in
  // localStorage instead of a cookie.
  const { theme, preference } = useThemeSwitcher();
  return (
    // Set the theme during SSR if possible, otherwise leave it up to the BlockingThemeLoader
    <html
      lang="en"
      className={classNames(theme)}
      data-theme-preference={preference ?? undefined}
      style={{ scrollPadding: top, colorScheme: theme ?? undefined }}
    >
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        {title && <title>{title}</title>}
        {themeLoader}
        <Meta />
        <Links />
        <Analytics
          analytics_google={config?.options?.analytics_google}
          analytics_plausible={config?.options?.analytics_plausible}
        />
        {head}
      </head>
      <body className="m-0 bg-myst-bg">
        <BaseUrlProvider baseurl={baseurl}>
          <SiteProvider config={config}>{children}</SiteProvider>
        </BaseUrlProvider>
        <ScrollRestoration />
        <Scripts />
        {liveReloadListener && <LiveReload />}
        {scripts}
      </body>
    </html>
  );
}

export function App() {
  const { theme, config } = useLoaderData<SiteLoader>();
  return (
    <Document theme={theme} config={config}>
      <Outlet />
    </Document>
  );
}

export function AppErrorBoundary() {
  const error = useRouteError();
  return (
    <Document theme={ThemePreference.light}>
      <main className="article-grid subgrid-gap col-screen">
        <article className="article">
          {isRouteErrorResponse(error) ? <Error404 /> : <ErrorUnhandled error={error as any} />}
        </article>
      </main>
    </Document>
  );
}
