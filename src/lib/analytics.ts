/**
 * One way to report an event, for the whole app.
 *
 * Every call site used to do `if (window.gtag) window.gtag(...)` inline. That
 * pattern silently drops anything that happens before the tag finishes loading,
 * which is exactly how the first live $97 `purchase` was lost: the event fired
 * the moment the webhook confirmed the sale, while `window.gtag` was still
 * undefined, and the check quietly failed.
 *
 * Two things stop that happening again:
 *
 *   1. `window.gtag` is defined synchronously in the document head (see
 *      app/layout.tsx), so calls always have somewhere to go.
 *   2. `track` still buffers until the tag is *configured*, not merely defined.
 *      A `gtag('event')` processed before `gtag('config')` never reaches the
 *      destination property, so pushing early would look fine and measure
 *      nothing. GoogleAnalytics sets `window.__gaConfigured` immediately after
 *      its config call, and the buffer flushes in order once it appears.
 *
 * If consent is never granted the tag never configures, the buffer is never
 * flushed, and nothing is sent. That is the intended behaviour, not a bug.
 */

type Params = Record<string, unknown>;

const FLUSH_POLL_MS = 100;
/** Give the tag 20s to configure. Past that the visitor has almost certainly
 *  declined consent or is blocking the script, and buffering forever is waste. */
const FLUSH_MAX_TRIES = 200;

let pending: Array<[string, Params]> = [];
let watching = false;

function configured(): boolean {
  return typeof window !== 'undefined' && window.__gaConfigured === true;
}

function send(event: string, params: Params): void {
  window.gtag?.('event', event, params);
}

function flush(): void {
  const queued = pending;
  pending = [];
  queued.forEach(([event, params]) => send(event, params));
}

function watchForConfig(): void {
  if (watching || typeof window === 'undefined') return;
  watching = true;
  let tries = 0;
  const id = setInterval(() => {
    tries += 1;
    if (configured()) {
      clearInterval(id);
      watching = false;
      flush();
      return;
    }
    if (tries >= FLUSH_MAX_TRIES) {
      clearInterval(id);
      watching = false;
      pending = [];
    }
  }, FLUSH_POLL_MS);
}

/**
 * Report an event to Google Analytics, buffering until the tag is ready.
 * Safe to call during render, in an effect, or from an event handler.
 */
export function track(event: string, params: Params = {}): void {
  if (typeof window === 'undefined') return;
  if (configured()) {
    send(event, params);
    return;
  }
  pending.push([event, params]);
  watchForConfig();
}

/**
 * A step we care about converting on. Reports to Google Analytics and also tags
 * the Clarity session, so a recording can be found by what the visitor did.
 */
export function trackConversion(event: string, params: Params = {}): void {
  track(event, params);
  if (typeof window !== 'undefined') {
    try { window.clarity?.('set', 'conversion', event); } catch { /* best effort */ }
  }
}
