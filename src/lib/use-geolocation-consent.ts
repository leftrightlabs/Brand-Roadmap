'use client';

import { useState, useEffect } from 'react';
import { 
  shouldShowCookieConsent, 
  initializeLocationDetection, 
  getStoredLocation,
  isGDPRCountry,
  type GeolocationData 
} from './geolocation-utils';
import { hasCookieConsent } from './cookie-utils';

export interface GeolocationConsentState {
  isLoading: boolean;
  requiresConsent: boolean;
  location: GeolocationData | null;
  hasConsent: boolean;
}

export function useGeolocationConsent(): GeolocationConsentState {
  const [state, setState] = useState<GeolocationConsentState>({
    isLoading: true,
    requiresConsent: true, // Default to requiring consent (GDPR-safe)
    location: null,
    hasConsent: false,
  });

  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    // Only run on client side to prevent hydration mismatch
    if (!isClient) return;
    
    let mounted = true;

    const initializeConsent = async () => {
      // Check if user already has consent
      const existingConsent = hasCookieConsent();
      
      // Get stored location if available
      const storedLocation = getStoredLocation();
      
      if (storedLocation && storedLocation.country) {
        // We have a stored location, determine if consent is required
        const requiresConsent = isGDPRCountry(storedLocation.country);
        
        // Debug logging for development
        if (process.env.NODE_ENV === 'development') {
          console.log('[useGeolocationConsent] Using stored location:', {
            country: storedLocation.country,
            requiresConsent,
            existingConsent
          });
        }
        
        if (mounted) {
          setState({
            isLoading: false,
            requiresConsent,
            location: storedLocation,
            hasConsent: existingConsent,
          });
        }
      } else {
        // No stored location, try to detect it
        if (process.env.NODE_ENV === 'development') {
          console.log('[useGeolocationConsent] No stored location, detecting...');
        }
        
        // Add a timeout to prevent hanging
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Location detection timeout')), 5000);
        });
        
        try {
          await Promise.race([
            initializeLocationDetection(),
            timeoutPromise
          ]);
          
          // Check again after detection
          const newStoredLocation = getStoredLocation();
          const requiresConsent = newStoredLocation && newStoredLocation.country 
            ? isGDPRCountry(newStoredLocation.country)
            : true; // Default to requiring consent if detection fails
          
          if (process.env.NODE_ENV === 'development') {
            console.log('[useGeolocationConsent] Location detected:', {
              country: newStoredLocation?.country,
              requiresConsent,
              existingConsent
            });
          }
          
          if (mounted) {
            setState({
              isLoading: false,
              requiresConsent,
              location: newStoredLocation,
              hasConsent: existingConsent,
            });
          }
        } catch (error) {
          console.warn('[useGeolocationConsent] Failed to initialize location detection:', error);
          
          if (mounted) {
            setState({
              isLoading: false,
              requiresConsent: true, // Default to requiring consent on error
              location: null,
              hasConsent: existingConsent,
            });
          }
        }
      }
    };

    // Listen for location detection events
    const handleLocationDetected = (event: CustomEvent) => {
      if (process.env.NODE_ENV === 'development') {
        console.log('[useGeolocationConsent] Location detected event received:', event.detail);
      }
      if (mounted) {
        const { location, requiresConsent } = event.detail;
        setState(prev => ({
          ...prev,
          isLoading: false,
          requiresConsent,
          location,
        }));
        if (process.env.NODE_ENV === 'development') {
          console.log('[useGeolocationConsent] State updated from event');
        }
      }
    };

    // Listen for consent changes
    const handleConsentChange = () => {
      if (mounted) {
        const newConsent = hasCookieConsent();
        setState(prev => ({
          ...prev,
          hasConsent: newConsent,
        }));
      }
    };

    // Initialize
    initializeConsent();

    // Add event listeners
    window.addEventListener('userLocationDetected', handleLocationDetected as EventListener);
    window.addEventListener('cookieConsentChanged', handleConsentChange);

    return () => {
      mounted = false;
      window.removeEventListener('userLocationDetected', handleLocationDetected as EventListener);
      window.removeEventListener('cookieConsentChanged', handleConsentChange);
    };
  }, [isClient]);

  return state;
}
