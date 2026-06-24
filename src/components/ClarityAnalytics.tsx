"use client";

import { useGeolocationConsent } from '@/lib/use-geolocation-consent';
import Script from 'next/script';

// Microsoft Clarity tracking. Honors EU/UK consent rules via geolocation hook.
// Default project ID is the Brand Roadmap project — pass projectId to override.

interface ClarityAnalyticsProps {
  projectId?: string;
}

export default function ClarityAnalytics({ projectId = 'v1jub11l5k' }: ClarityAnalyticsProps) {
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
    <Script
      id={`microsoft-clarity-${projectId}`}
      strategy="lazyOnload"
    >
      {`
        (function(c,l,a,r,i,t,y){
            c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
            t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
            y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
        })(window, document, "clarity", "script", "${projectId}");
      `}
    </Script>
  );
}
