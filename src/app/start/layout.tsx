import type { Metadata } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://roadmap.leftrightlabs.com';

export const metadata: Metadata = {
  title: "Brand Roadmap™ | Left Right Labs",
  description: "Your expertise has outpaced your brand. Get a free, personalized Brand Advantage™ Roadmap — the specific moves to re-align your brand and reconnect with the clients you want next.",
  alternates: { canonical: `${SITE_URL}/start` },
  openGraph: {
    title: "Brand Roadmap™ | Left Right Labs",
    description: "Get a free, personalized Brand Advantage™ Roadmap — the specific moves to re-align your brand and connect with the clients you want next.",
    url: `${SITE_URL}/start`,
    images: [
      {
        url: "/images/brand-advantage-og.png",
        width: 1200,
        height: 630,
        alt: "Brand Roadmap by Left Right Labs",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Brand Roadmap™ | Left Right Labs",
    description: "Get a free, personalized Brand Advantage™ Roadmap — the specific moves to re-align your brand and connect with the clients you want next.",
    images: ["/images/brand-advantage-og.png"],
  },
};

export default function StartLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
