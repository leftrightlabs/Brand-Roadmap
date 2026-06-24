import type { MetadataRoute } from 'next'

// ─── Sitemap ────────────────────────────────────────────────────────────────
// Only the public landing page is listed. The form funnel + per-lead reports
// have no value to a search engine.

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://roadmap.leftrightlabs.com'

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: `${SITE_URL}/start`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1.0,
    },
  ]
}
