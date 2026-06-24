// Geolocation utility functions for GDPR compliance

// EU member states (as of 2024)
const EU_COUNTRIES = [
  'AT', // Austria
  'BE', // Belgium
  'BG', // Bulgaria
  'HR', // Croatia
  'CY', // Cyprus
  'CZ', // Czech Republic
  'DK', // Denmark
  'EE', // Estonia
  'FI', // Finland
  'FR', // France
  'DE', // Germany
  'GR', // Greece
  'HU', // Hungary
  'IE', // Ireland
  'IT', // Italy
  'LV', // Latvia
  'LT', // Lithuania
  'LU', // Luxembourg
  'MT', // Malta
  'NL', // Netherlands
  'PL', // Poland
  'PT', // Portugal
  'RO', // Romania
  'SK', // Slovakia
  'SI', // Slovenia
  'ES', // Spain
  'SE', // Sweden
];

// UK (separate from EU after Brexit)
const UK_COUNTRY = 'GB';

export interface GeolocationData {
  country: string;
  region?: string;
  city?: string;
}

export function isGDPRCountry(countryCode: string): boolean {
  const upperCountryCode = countryCode.toUpperCase();
  const isGDPR = EU_COUNTRIES.includes(upperCountryCode) || upperCountryCode === UK_COUNTRY;
  
  if (process.env.NODE_ENV === 'development') {
    console.log(`[isGDPRCountry] Checking ${countryCode} (${upperCountryCode}): ${isGDPR}`);
  }
  
  return isGDPR;
}

export async function detectUserLocation(): Promise<GeolocationData | null> {
  try {
    // Check if we're on localhost
    if (typeof window !== 'undefined' && 
        (window.location.hostname === 'localhost' || 
         window.location.hostname === '127.0.0.1' ||
         window.location.hostname.includes('localhost'))) {
      console.log('[Geolocation] Detected localhost, using development fallback');
      // For development, you can set a default country here
      // Set to 'US' for testing non-GDPR behavior, or 'GB' for testing GDPR behavior
      return {
        country: 'US', // Change this to 'GB' to test GDPR behavior
        region: 'Development',
        city: 'Localhost',
      };
    }

    // Try to get location from IP using a free geolocation service
    const response = await fetch('https://ipapi.co/json/', {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    return {
      country: data.country_code || '',
      region: data.region || '',
      city: data.city || '',
    };
  } catch (error) {
    console.warn('[Geolocation] Failed to detect user location:', error);
    return null;
  }
}

export function getStoredLocation(): GeolocationData | null {
  if (typeof window === 'undefined') return null;
  
  try {
    const stored = localStorage.getItem('userLocation');
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.warn('[Geolocation] Failed to parse stored location:', error);
  }
  
  return null;
}

export function storeLocation(location: GeolocationData): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem('userLocation', JSON.stringify(location));
  } catch (error) {
    console.warn('[Geolocation] Failed to store location:', error);
  }
}

export function shouldShowCookieConsent(): boolean {
  // Check if we have a stored location
  const storedLocation = getStoredLocation();
  
  if (storedLocation && storedLocation.country) {
    return isGDPRCountry(storedLocation.country);
  }
  
  // If no stored location, default to showing consent (GDPR-compliant approach)
  // This ensures we don't accidentally violate GDPR by not showing consent
  return true;
}

// Development utility to override location for testing
export function setDevelopmentLocation(countryCode: string): void {
  if (typeof window === 'undefined' || process.env.NODE_ENV !== 'development') {
    console.log('[Geolocation] setDevelopmentLocation called but not in development mode');
    return;
  }
  
  console.log(`[Geolocation] Setting development location to: ${countryCode}`);
  
  const location: GeolocationData = {
    country: countryCode.toUpperCase(),
    region: 'Development',
    city: 'Test',
  };
  
  storeLocation(location);
  
  // Dispatch event to notify components
  const event = new CustomEvent('userLocationDetected', {
    detail: { location, requiresConsent: isGDPRCountry(countryCode) }
  });
  
  window.dispatchEvent(event);
  
  console.log(`[Geolocation] Development location set to: ${countryCode}, event dispatched`);
}

export async function initializeLocationDetection(): Promise<void> {
  // Only run on client side
  if (typeof window === 'undefined') return;
  
  // Check if we already have a stored location
  const storedLocation = getStoredLocation();
  if (storedLocation && storedLocation.country) {
    return;
  }
  
  // Try to detect location
  const location = await detectUserLocation();
  if (location) {
    storeLocation(location);
    
    // Dispatch event to notify components of location change
    window.dispatchEvent(new CustomEvent('userLocationDetected', {
      detail: { location, requiresConsent: isGDPRCountry(location.country) }
    }));
  } else {
    // If detection fails, set a default for development
    if (process.env.NODE_ENV === 'development') {
      const defaultLocation: GeolocationData = {
        country: 'US',
        region: 'Development',
        city: 'Localhost',
      };
      storeLocation(defaultLocation);
      
      window.dispatchEvent(new CustomEvent('userLocationDetected', {
        detail: { location: defaultLocation, requiresConsent: false }
      }));
    }
  }
}
