import type { ThemePreference } from '@myst-theme/common';

export function postThemeToAPI(preference: ThemePreference) {
  const xmlhttp = new XMLHttpRequest();
  xmlhttp.open('POST', '/api/theme');
  xmlhttp.setRequestHeader('Content-Type', 'application/json;charset=UTF-8');
  xmlhttp.send(JSON.stringify({ theme: preference }));
}
