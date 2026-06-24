'use client';

import { useEffect, useState } from 'react';
import { initializeLocationDetection } from '@/lib/geolocation-utils';

export default function GeolocationInitializer() {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    // Only run on client side to prevent hydration mismatch
    if (!isClient) return;
    
    // Initialize location detection as soon as the component mounts
    initializeLocationDetection().catch(error => {
      console.warn('[GeolocationInitializer] Failed to initialize location detection:', error);
    });
  }, [isClient]);

  // This component doesn't render anything
  return null;
}
