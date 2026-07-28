import { useThemeSwitcher } from '@myst-theme/providers';
import { MoonIcon, SunIcon } from '@heroicons/react/24/solid';
import classNames from 'classnames';

/**
 * A half-filled circle, a common icon for following the system color scheme.
 * Drawn in the style of the heroicons 24x24 solid icons.
 */
function SystemIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25ZM12 4.5a7.5 7.5 0 0 1 0 15V4.5Z"
      />
    </svg>
  );
}

// The icon visibility is driven by the `data-theme-preference` attribute on <html>
// (set during SSR or pre-hydration by the BlockingThemeLoader), rather than by React state,
// so that the server-rendered button is identical to the first client render.
export function ThemeButton({ className = 'w-10 h-10 mx-3' }: { className?: string }) {
  const { nextTheme } = useThemeSwitcher();
  return (
    <button
      className={classNames(
        'myst-theme-button theme shrink-0 rounded-full border border-myst-border-strong hover:bg-myst-surface border-solid overflow-hidden text-myst-text-secondary',
        className,
      )}
      title={`Change the color theme (light, dark, or system)`}
      aria-label={`Change the color theme (light, dark, or system)`}
      onClick={nextTheme}
    >
      <SunIcon className="myst-theme-sun-icon h-full w-full p-[18%] hidden [[data-theme-preference=light]_&]:block" />
      <MoonIcon className="myst-theme-moon-icon h-full w-full p-[18%] hidden [[data-theme-preference=dark]_&]:block" />
      <SystemIcon className="myst-theme-system-icon h-full w-full p-[18%] block [[data-theme-preference=light]_&]:hidden [[data-theme-preference=dark]_&]:hidden" />
    </button>
  );
}
