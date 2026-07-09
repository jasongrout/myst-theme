import { useState, useEffect, useRef } from 'react';
import { MyST } from 'myst-to-react';
import classNames from 'classnames';
import type { GenericParent } from 'myst-common';
import { hashString } from '~/utils/hash';
import { XMarkIcon } from '@heroicons/react/24/solid';
import { useBannerState } from '@myst-theme/providers';

type BannerMessage = {
  id: string;
  slot: 'part' | 'url';
  ast?: GenericParent;
  html?: string;
};

const STORAGE_PREFIX = 'myst-dismissed-banner-';

/**
 * A banner component at the top that shows messages passed as a MyST AST
 * and/or an HTML fragment fetched from a URL when the page loads. Each
 * message can be dismissed independently.
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
  // An empty banner part still arrives as an mdast root with no children
  const hasLocalContent = !!content && (content.children?.length ?? 0) > 0;

  // Message fetched from `url` on the client; undefined while the fetch is in
  // flight, empty when there is no remote banner (no url, empty response, or
  // fetch failure). Its dismissal is tracked by the message text rather than
  // its HTML, so markup-only changes do not re-show a dismissed message.
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

  // Each message has an ID identifying its content; if a message changes,
  // its ID will be different and it'll show again
  const messages: BannerMessage[] = [];
  if (hasLocalContent) {
    messages.push({ id: hashString(JSON.stringify(content)), slot: 'part', ast: content });
  }
  if (remote?.html) {
    messages.push({ id: hashString(remote.text), slot: 'url', html: remote.html });
  }
  const messageIds = messages.map((m) => m.id).join(',');

  // Dismissal state is bounded: one localStorage key per slot, holding the ID
  // of the currently dismissed message, so storage does not grow as
  // announcements change over time. Start with dismissal unknown, and only
  // show messages after checking localStorage on the client. This avoids
  // flickering on initial load.
  const [dismissed, setDismissed] = useState<Record<string, string | null> | undefined>(undefined);

  useEffect(() => {
    setDismissed({
      part: localStorage.getItem(`${STORAGE_PREFIX}part`),
      url: localStorage.getItem(`${STORAGE_PREFIX}url`),
    });
  }, [messageIds]);

  const visibleMessages = dismissed ? messages.filter((m) => dismissed[m.slot] !== m.id) : [];
  const visibleIds = visibleMessages.map((m) => m.id).join(',');

  // Share the overall visibility and height of the banner so that other
  // components, like the sidebar, can adjust their layout
  const { setBannerState } = useBannerState();
  const ref = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (dismissed === undefined) return;
    const el = ref.current;
    setBannerState({
      visible: visibleMessages.length > 0,
      height: el ? el.getBoundingClientRect().height : 0,
    });
  }, [visibleIds, dismissed === undefined]);

  const handleDismiss = (message: BannerMessage) => {
    localStorage.setItem(`${STORAGE_PREFIX}${message.slot}`, message.id);
    setDismissed((prev) => ({ ...prev, [message.slot]: message.id }));
  };

  // Don't render if there is nothing to show
  if (visibleMessages.length === 0) return null;

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
      <div className="max-w-screen-lg mx-auto space-y-2">
        {visibleMessages.map((message) => (
          <div key={message.id} className="flex items-center gap-4">
            {/* Message content */}
            <div className="flex-1 text-sm text-center text-myst-accent-surface-text [&>*]:m-0 [&_a]:underline [&_a]:font-semibold">
              {message.ast && <MyST ast={message.ast} />}
              {message.html && (
                // The site author controls the banner URL, so its content shares
                // their trust level, as with pydata-sphinx-theme's announcement option
                <div className="[&>*]:m-0" dangerouslySetInnerHTML={{ __html: message.html }} />
              )}
            </div>

            {/* Close button */}
            <button
              onClick={() => handleDismiss(message)}
              className="flex-shrink-0 p-1 rounded hover:bg-myst-accent-surface-border focus:outline-none focus-visible:ring-2 focus-visible:ring-myst-focus-ring focus-visible:ring-offset-2 transition-colors"
              aria-label="Dismiss announcement"
              type="button"
            >
              <XMarkIcon className="w-5 h-5 text-myst-accent-surface-text" aria-hidden="true" />
            </button>
          </div>
        ))}
      </div>
    </header>
  );
}
