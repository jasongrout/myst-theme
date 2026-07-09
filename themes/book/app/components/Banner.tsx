import { useState, useEffect, useRef } from 'react';
import { MyST } from 'myst-to-react';
import classNames from 'classnames';
import type { GenericParent } from 'myst-common';
import { hashString } from '~/utils/hash';
import { XMarkIcon } from '@heroicons/react/24/solid';
import { useBannerState } from '@myst-theme/providers';

/**
 * A dismissible banner component at the top that shows content passed as a MyST AST
 * and/or an HTML fragment fetched from a URL when the page loads.
 *
 * Fetching from a URL allows an announcement to be managed centrally across many
 * sites and updated without rebuilding them, for example
 * https://jupyter.org/assets/banner.html. An empty response means no banner.
 */
export function Banner({
  content,
  url,
  className,
}: {
  content?: GenericParent;
  url?: string;
  className?: string;
}) {
  // Banner fetched from `url` on the client; undefined while the fetch is in
  // flight, empty when there is no remote banner (no url, empty response, or
  // fetch failure). Dismissal is tracked by the banner text rather than its
  // HTML, so markup-only changes do not re-show a dismissed banner.
  const [remote, setRemote] = useState<{ html: string; text: string } | undefined>(
    url ? undefined : { html: '', text: '' },
  );

  useEffect(() => {
    if (!url) {
      setRemote({ html: '', text: '' });
      return;
    }
    let cancelled = false;
    fetch(url)
      .then((resp) => (resp.ok ? resp.text() : ''))
      .catch(() => '')
      .then((html) => {
        if (cancelled) return;
        const trimmed = html.trim();
        const doc = new DOMParser().parseFromString(trimmed, 'text/html');
        const text = doc.body.textContent?.replace(/\s+/g, ' ').trim() ?? '';
        setRemote({ html: trimmed, text });
      });
    return () => {
      cancelled = true;
    };
  }, [url]);

  // An empty banner part still arrives as an mdast root with no children
  const hasLocalContent = !!content && (content.children?.length ?? 0) > 0;

  // Generate banner ID from content for storing dismissal state; undefined
  // until any remote content has resolved so we don't flash or measure early
  const contentString = hasLocalContent ? JSON.stringify(content) : '';
  const bannerId = remote === undefined ? undefined : hashString(contentString + remote.text);

  // Start hidden, only show after checking localStorage on client.
  // This avoids flickering on initial load.
  const { bannerState, setBannerState } = useBannerState();

  const ref = useRef<HTMLElement | null>(null);

  // Check dismissal state on client side
  // If the banner content changes, the ID will be different and it'll show again
  useEffect(() => {
    if (bannerId === undefined) return;
    const el = ref.current;

    const empty = !hasLocalContent && !remote?.html;
    const dismissed = localStorage.getItem(`myst-dismissed-banner-${bannerId}`) === 'true';
    setBannerState({
      visible: !empty && !dismissed,
      height: el ? el.getBoundingClientRect().height : 0,
    });
  }, [bannerId, bannerState.visible]);

  const handleDismiss = () => {
    localStorage.setItem(`myst-dismissed-banner-${bannerId}`, 'true');
    setBannerState({
      visible: false,
      height: 0,
    });
  };

  // Don't render if not visible
  if (!bannerState.visible) return null;

  // Should be styled similarly to the footer
  return (
    <header
      aria-label="Announcement banner"
      className={classNames(
        'myst-banner w-full bg-myst-accent-surface border-b border-myst-accent-surface-border',
        'px-4 py-3 sm:px-6 lg:px-8',
        'relative z-40',
        className,
      )}
      ref={ref}
    >
      <div className="max-w-screen-lg mx-auto flex items-center gap-4">
        {/* Banner content */}
        <div className="flex-1 text-sm text-center text-myst-accent-surface-text [&>*]:m-0 [&_a]:underline [&_a]:font-semibold">
          {hasLocalContent && <MyST ast={content} />}
          {remote?.html && (
            // The site author controls this URL, so the content shares their
            // trust level, as with pydata-sphinx-theme's announcement option
            <div className="[&>*]:m-0" dangerouslySetInnerHTML={{ __html: remote.html }} />
          )}
        </div>

        {/* Close button */}
        <button
          onClick={handleDismiss}
          className="flex-shrink-0 p-1 rounded hover:bg-myst-accent-surface-border focus:outline-none focus-visible:ring-2 focus-visible:ring-myst-focus-ring focus-visible:ring-offset-2 transition-colors"
          aria-label="Dismiss announcement"
          type="button"
        >
          <XMarkIcon className="w-5 h-5 text-myst-accent-surface-text" aria-hidden="true" />
        </button>
      </div>
    </header>
  );
}
