'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { X } from 'lucide-react';
import { setCookieConsent } from '@/lib/cookie-utils';
import { useGeolocationConsent } from '@/lib/use-geolocation-consent';

export default function CookieConsentBanner() {
  const [isVisible, setIsVisible] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const { isLoading, requiresConsent, hasConsent } = useGeolocationConsent();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    // Only show banner if:
    // 1. We're mounted (client-side only)
    // 2. We're not loading
    // 3. User requires consent (is in UK/EU)
    // 4. User hasn't given consent yet
    if (isMounted && !isLoading && requiresConsent && !hasConsent) {
      if (process.env.NODE_ENV === 'development') {
        console.log('[CookieConsentBanner] Showing banner:', { isLoading, requiresConsent, hasConsent });
      }
      setIsVisible(true);
    } else {
      if (process.env.NODE_ENV === 'development') {
        console.log('[CookieConsentBanner] Hiding banner:', { isMounted, isLoading, requiresConsent, hasConsent });
      }
      setIsVisible(false);
    }
  }, [isMounted, isLoading, requiresConsent, hasConsent]);

  // Debug: Force show banner for testing
  useEffect(() => {
    if (process.env.NODE_ENV === 'development' && isMounted) {
      console.log('[CookieConsentBanner] Debug state:', {
        isMounted,
        isLoading,
        requiresConsent,
        hasConsent,
        isVisible
      });
    }
  }, [isMounted, isLoading, requiresConsent, hasConsent, isVisible]);

  // Debug: Force show banner for testing (temporary)
  useEffect(() => {
    if (process.env.NODE_ENV === 'development' && isMounted) {
      // Force show banner for testing - remove this after testing
      const forceShow = localStorage.getItem('forceShowBanner');
      if (forceShow === 'true') {
        console.log('[CookieConsentBanner] Force showing banner for testing');
        setIsVisible(true);
      }
    }
  }, [isMounted]);

  const handleAccept = () => {
    console.log('[CookieConsentBanner] Accept clicked, setting consent...');
    setCookieConsent();
    setIsVisible(false);
    console.log('[CookieConsentBanner] Consent set, banner hidden');
  };

  const handleClose = () => {
    setIsVisible(false);
  };

  // Don't render anything until mounted to avoid hydration mismatch
  if (!isMounted || !isVisible) {
    if (process.env.NODE_ENV === 'development') {
      console.log('[CookieConsentBanner] Not rendering:', { isMounted, isVisible });
    }
    return null;
  }

  return (
    <div
      role="banner"
      aria-label="Cookie consent"
      className="fixed bottom-0 left-0 right-0 z-50 bg-[#112248] border-t border-[#a7c140]/30 shadow-lg"
      style={{ animation: 'slideUp 0.3s ease-out' }}
    >
      <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex-1">
            <p className="text-sm text-white leading-relaxed">
              We use cookies to improve your experience. By using this site, you accept our use of cookies.{' '}
              <Link 
                href="/cookie-policy" 
                className="text-[#a7c140] hover:text-white underline font-medium"
              >
                Learn more
              </Link>
            </p>
          </div>
          
          <div className="flex items-center gap-3 flex-shrink-0">
            <button
              onClick={handleAccept}
              className="px-4 py-2 bg-[#a7c140] hover:bg-[#96ad39] text-[#112248] text-sm font-bold uppercase tracking-wide rounded-none focus:outline-none focus:ring-2 focus:ring-[#a7c140] focus:ring-offset-2 transition-colors"
              aria-label="Accept cookies"
            >
              Accept
            </button>
            
            <button
              onClick={handleClose}
              className="p-2 text-gray-300 hover:text-white focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 rounded-md transition-colors"
              aria-label="Close cookie banner"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
      
      <style jsx>{`
        @keyframes slideUp {
          from {
            transform: translateY(100%);
          }
          to {
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
} 