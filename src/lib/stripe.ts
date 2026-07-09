import Stripe from 'stripe';

// Lazy Stripe client — mirrors the db.ts pattern. `next build` imports every
// route module during page-data collection, so we must never instantiate at
// module load (that would require STRIPE_SECRET_KEY at build time, which the
// Dockerfile build doesn't have). The key is only needed when a request runs.

let _stripe: Stripe | null = null;

/** Payments are only live once the secret key is configured on the server. */
export function stripeEnabled(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

export function getStripe(): Stripe {
  if (!_stripe) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) {
      throw new Error('STRIPE_SECRET_KEY is not set. Add it in Railway to enable payments.');
    }
    // No pinned apiVersion — use the account's default so we aren't coupled to
    // a specific SDK/API version string.
    _stripe = new Stripe(key);
  }
  return _stripe;
}

/** $97 one-time unlock, in cents. Keep in sync with FULL_PRICE in the report UI. */
export const FULL_ROADMAP_PRICE_CENTS = 9700;
