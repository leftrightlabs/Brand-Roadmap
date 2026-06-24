// Global type declarations

interface Window {
  gtag?: (
    command: 'event' | 'config' | 'js',
    targetId: string,
    config?: Record<string, any>
  ) => void;
  dataLayer?: any[];
  clarity?: (command: string, key: string, value: string) => void;
}
