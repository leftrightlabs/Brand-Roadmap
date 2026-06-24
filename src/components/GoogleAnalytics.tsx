"use client";

import { useGeolocationConsent } from '@/lib/use-geolocation-consent';
import Script from 'next/script';

// Google Analytics tracking. Honors EU/UK consent rules via geolocation hook.
// Default measurement ID is the Brand Roadmap property — pass measurementId to override.

interface GoogleAnalyticsProps {
  measurementId?: string;
}

export default function GoogleAnalytics({ measurementId = 'G-2XFHTEQ3ZV' }: GoogleAnalyticsProps) {
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
        strategy="lazyOnload"
      />
      <Script id={`google-analytics-${measurementId}`} strategy="lazyOnload">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${measurementId}', {
            page_title: document.title,
            page_location: window.location.href,
            send_page_view: true
          });
        `}
      </Script>
    </>
  );
}
