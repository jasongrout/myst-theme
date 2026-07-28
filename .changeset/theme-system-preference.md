---
'@myst-theme/common': minor
'@myst-theme/providers': minor
'@myst-theme/site': minor
'@myst-theme/styles': patch
'@myst-theme/article': patch
'@myst-theme/book': patch
---

Add a "system" option to the theme switcher, following the OS color scheme (#903)

- The stored theme value (cookie or localStorage) is now a `ThemePreference` (`light`, `dark`, or `system`) that resolves to the applied `Theme`; the default for new visitors is `system`, and OS theme changes now only affect the page when the preference is `system` (an explicitly chosen theme is no longer overridden).
- The theme button cycles system → light → dark, showing a half-filled circle, sun, or moon icon; the current preference is exposed as `data-theme-preference` on the root element.
- The themes now set the CSS `color-scheme` property (stylesheet, SSR inline style, and the pre-hydration script) so native form controls, scrollbars, and the default canvas match the theme, and the pre-hydration theme script is injected before the stylesheet links so it runs before first paint (#684).
- Breaking (types): `ThemeProvider`/`useThemeSwitcher`'s `setTheme` now takes a `ThemePreference`, and `Document`'s `theme` prop / `SiteLoader.theme` are now `ThemePreference`.
