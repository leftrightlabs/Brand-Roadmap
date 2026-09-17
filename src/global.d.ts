// Global type declarations

interface Window {
  gtag?: (
    command: 'event' | 'config' | 'js',
    targetId: string,
    config?: Record<string, any>
  ) => void;
  dataLayer?: any[];
  /** Set by <GoogleAnalytics> once gtag('config') has run. */
  __gaConfigured?: boolean;
  clarity?: (command: string, key: string, value: string) => void;
}
