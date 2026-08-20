import type { Metadata } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://roadmap.brandelevation.ai';

export const metadata: Metadata = {
  title: "Brand Elevation Roadmap™ | Left Right Labs",
  description: "Your expertise has outpaced your brand. Get a free, personalized Brand Elevation Roadmap — the specific moves to re-align your brand and reconnect with the clients you want next.",
  alternates: { canonical: `${SITE_URL}/start` },
  openGraph: {
    title: "Brand Elevation Roadmap™ | Left Right Labs",
    description: "Get a free, personalized Brand Elevation Roadmap — the specific moves to re-align your brand and connect with the clients you want next.",
    url: `${SITE_URL}/start`,
    images: [
      {
        url: "/images/brand-advantage-og.png",
        width: 1200,
        height: 630,
        alt: "Brand Elevation Roadmap by Left Right Labs",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Brand Elevation Roadmap™ | Left Right Labs",
    description: "Get a free, personalized Brand Elevation Roadmap — the specific moves to re-align your brand and connect with the clients you want next.",
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
