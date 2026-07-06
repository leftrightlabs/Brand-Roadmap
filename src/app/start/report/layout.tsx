import type { Metadata } from "next";

// Per-lead reports are private and must never be indexed. This adds
// <meta name="robots" content="noindex, nofollow"> to every report page
// (the X-Robots-Tag header in middleware.ts is the second layer), and clears
// the /start canonical the parent layout would otherwise apply here.
export const metadata: Metadata = {
  robots: { index: false, follow: false, nocache: true },
  alternates: { canonical: undefined },
};

export default function ReportLayout({ children }: { children: React.ReactNode }) {
  return children;
}
