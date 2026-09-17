"use client";

import { useGeolocationConsent } from '@/lib/use-geolocation-consent';
import Script from 'next/script';

// Google Analytics tracking. Honors EU/UK consent rules via geolocation hook.
// Default measurement ID is the Brand Elevation Roadmap property; pass measurementId to override.
//
// dataLayer and gtag themselves are defined in the document head (app/layout.tsx)
// so events can queue from the first paint; this component only loads the
// library and configures the destination, and only once consent allows it.
//
// Both scripts are afterInteractive, NOT lazyOnload. lazyOnload waits for the
// window load event plus an idle callback, which is far too late for anything
// that fires soon after mount: the $97 `purchase` event runs the moment the
// paid flag lands and was being dropped every time because window.gtag did not
// exist yet. afterInteractive also defines the dataLayer/gtag shim early, so
// any gtag() call made before gtag.js finishes downloading is queued rather
// than lost.

interface GoogleAnalyticsProps {
  measurementId?: string;
}

export default function GoogleAnalytics({ measurementId = 'G-PTZV3V8NF8' }: GoogleAnalyticsProps) {
  const { isLoading, requiresConsent, hasConsent } = useGeolocationConsent();

  // Block in UK/EU until consent is given
  if (requiresConsent && !hasConsent) {
    return null;
  }

  // Wait for consent state to load before deciding
  if (isLoading && requiresConsent) {
    return null;
  }

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`}
        strategy="afterInteractive"
      />
      <Script id={`google-analytics-${measurementId}`} strategy="afterInteractive">
        {`
          gtag('js', new Date());
          gtag('config', '${measurementId}', {
            page_title: document.title,
            page_location: window.location.href,
            send_page_view: true
          });
          // Tells lib/analytics.ts the destination is configured and its buffer
          // can be flushed. An event processed before this config call never
          // reaches the property, so buffering is keyed on configuration rather
          // than on window.gtag merely existing.
          window.__gaConfigured = true;
        `}
      </Script>
    </>
  );
}
