// Cookie utility functions for consent management

export const COOKIE_CONSENT_KEY = 'cookieConsent';

export function setCookie(name: string, value: string, days: number = 365): void {
  if (typeof window === 'undefined') return;
  
  const expires = new Date();
  expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000));
  
  document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;SameSite=Lax`;
}

export function getCookie(name: string): string | null {
  if (typeof window === 'undefined') return null;
  
  const nameEQ = name + "=";
  const ca = document.cookie.split(';');
  
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === ' ') c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
  }
  
  return null;
}

export function hasCookieConsent(): boolean {
  const consent = getCookie(COOKIE_CONSENT_KEY);
  return consent === 'accepted';
}

export function setCookieConsent(): void {
  setCookie(COOKIE_CONSENT_KEY, 'accepted', 365);
  
  // Dispatch custom event to notify components of consent change
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('cookieConsentChanged'));
  }
}

export function removeCookie(name: string): void {
  if (typeof window === 'undefined') return;
  
  document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;`;
} 