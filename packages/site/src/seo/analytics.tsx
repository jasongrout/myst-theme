type SiteAnalytics = {
  analytics_google?: string;
  /** @deprecated Use `analytics_plausible_script` with the new Plausible snippet format */
  analytics_plausible?: string;
  analytics_plausible_script?: string;
};

const getGoogleAnalyticsScript = (tag: string) =>
  `window.dataLayer = window.dataLayer || []; function gtag(){dataLayer.push(arguments);} gtag('js', new Date()); gtag('config', '${tag}');`;

const PLAUSIBLE_INIT_SCRIPT =
  'window.plausible=window.plausible||function(){(plausible.q=plausible.q||[]).push(arguments)},plausible.init=plausible.init||function(i){plausible.o=i||{}};plausible.init();';

/**
 * Resolve the value of `analytics_plausible_script` to a script URL.
 *
 * Accepts a full script URL (e.g. `https://plausible.io/js/pa-XXXX.js`, which
 * also supports self-hosted instances) or a bare script id (e.g. `pa-XXXX`),
 * both available from the Site Installation section of the Plausible site settings.
 */
function getPlausibleScriptSrc(value: string): string {
  if (/^https?:\/\//.test(value)) return value;
  return `https://plausible.io/js/${value.replace(/\.js$/, '')}.js`;
}

export function Analytics({
  analytics_google,
  analytics_plausible,
  analytics_plausible_script,
}: SiteAnalytics) {
  return (
    <>
      {analytics_plausible_script && (
        <>
          <script async src={getPlausibleScriptSrc(analytics_plausible_script)}></script>
          <script dangerouslySetInnerHTML={{ __html: PLAUSIBLE_INIT_SCRIPT }} />
        </>
      )}
      {!analytics_plausible_script && analytics_plausible && (
        <script
          defer
          data-domain={analytics_plausible}
          src="https://plausible.io/js/plausible.js"
        ></script>
      )}
      {analytics_google && (
        <>
          <script
            async
            src={`https://www.googletagmanager.com/gtag/js?id=${analytics_google}`}
          ></script>
          <script
            dangerouslySetInnerHTML={{
              __html: getGoogleAnalyticsScript(analytics_google),
            }}
          />
        </>
      )}
    </>
  );
}
