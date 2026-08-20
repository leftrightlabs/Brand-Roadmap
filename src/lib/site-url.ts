/**
 * The one place the app decides what its own public address is.
 *
 * Two things are built from this and must never disagree:
 *  - the report URL pushed to ActiveCampaign (`%BRAND_ROADMAP_URL%`), which
 *    lands in a customer's inbox and has to keep working for years
 *  - Stripe's `return_url` after embedded checkout
 *
 * Resolution order is deliberate. `RAILWAY_PUBLIC_DOMAIN` is only a fallback
 * because Railway picks one arbitrarily once a service has more than one
 * custom domain attached, which is exactly the situation during a domain move.
 * Set NEXT_PUBLIC_SITE_URL explicitly and the guesswork goes away.
 */

const DEFAULT_ORIGIN = 'https://roadmap.brandelevation.ai';

export function canonicalOrigin(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (explicit) return explicit.replace(/\/+$/, '');

  const railway = process.env.RAILWAY_PUBLIC_DOMAIN?.trim();
  if (railway) return `https://${railway.replace(/^https?:\/\//, '').replace(/\/+$/, '')}`;

  return DEFAULT_ORIGIN;
}

/** Bare hostname (no scheme, no trailing slash) for display and comparison. */
export function canonicalHost(): string {
  return canonicalOrigin().replace(/^https?:\/\//, '');
}
