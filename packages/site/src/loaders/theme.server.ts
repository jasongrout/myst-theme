import { createCookieSessionStorage, json } from '@remix-run/node';
import { isThemePreference } from '@myst-theme/providers';
import type { ThemePreference } from '@myst-theme/providers';
import type { ActionFunction } from '@remix-run/node';

export const themeStorage = createCookieSessionStorage({
  cookie: {
    name: 'theme',
    secure: true,
    secrets: ['secret'],
    sameSite: 'lax',
    path: '/',
    httpOnly: true,
  },
});

async function getThemeSession(request: Request) {
  const session = await themeStorage.getSession(request.headers.get('Cookie'));
  return {
    getTheme: () => {
      const themeValue = session.get('theme');
      return isThemePreference(themeValue) ? themeValue : undefined;
    },
    setTheme: (preference: ThemePreference) => session.set('theme', preference),
    commit: () => themeStorage.commitSession(session, { expires: new Date('2100-01-01') }),
  };
}

export { getThemeSession };

export const setThemeAPI: ActionFunction = async ({ request }) => {
  const themeSession = await getThemeSession(request);
  const data = await request.json();
  const { theme } = data ?? {};
  if (!isThemePreference(theme)) {
    return json({
      success: false,
      message: `Invalid theme: "${theme}".`,
    });
  }
  themeSession.setTheme(theme);
  return json(
    { success: true, theme },
    {
      headers: { 'Set-Cookie': await themeSession.commit() },
    },
  );
};
