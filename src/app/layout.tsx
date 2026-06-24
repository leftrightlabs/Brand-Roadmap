import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import GoogleAnalytics from "@/components/GoogleAnalytics";
import ClarityAnalytics from "@/components/ClarityAnalytics";
import CookieConsentBanner from "@/components/CookieConsentBanner";
import GeolocationInitializer from "@/components/GeolocationInitializer";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://roadmap.leftrightlabs.com';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "Brand Roadmap™ | Left Right Labs",
  description: "Your expertise has outpaced your brand. Get a free, personalized Brand Roadmap™ — the specific moves to re-align your brand and reconnect with the clients you want next.",
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: '32x32', type: 'image/x-icon' },
      { url: '/favicon.svg', type: 'image/svg+xml' },
    ],
    apple: { url: '/favicon.png', type: 'image/png' },
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Adobe Fonts (Typekit): Scotch Display + Sweet Sans Pro. Allowlist new
            domain at fonts.adobe.com if fonts fail to load on the live site. */}
        <link rel="preconnect" href="https://use.typekit.net" />
        <link rel="preconnect" href="https://use.typekit.net" crossOrigin="anonymous" />
        <script src="https://use.typekit.net/uwk2elu.js" />
        <script dangerouslySetInnerHTML={{ __html: "try{Typekit.load({ async: true });}catch(e){}" }} />
        <link rel="icon" href="/favicon.ico" sizes="32x32" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/favicon.png" />
      </head>
      <body className="min-h-screen bg-background font-sans antialiased" suppressHydrationWarning>
        <GeolocationInitializer />
        <GoogleAnalytics />
        <ClarityAnalytics />
        {children}
        <Toaster />
        <CookieConsentBanner />
      </body>
    </html>
  );
}
