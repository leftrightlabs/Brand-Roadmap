import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getStripe, stripeEnabled, FULL_ROADMAP_PRICE_CENTS } from '@/lib/stripe';

export const runtime = 'nodejs';

// Creates a Stripe Checkout session for the $97 full-roadmap unlock, tied to a
// specific report via metadata.shortId. The webhook (stripe-webhook) flips the
// `paid` flag when the payment completes — never trust the client for that.
export async function POST(request: NextRequest) {
  try {
    if (!stripeEnabled()) {
      return NextResponse.json({ error: 'Payments are not configured yet.' }, { status: 503 });
    }

    const { shortId } = await request.json();
    if (!shortId || typeof shortId !== 'string') {
      return NextResponse.json({ error: 'shortId is required' }, { status: 400 });
    }

    const rows = await sql<
      { paid: boolean; expires_at: string; email: string | null }[]
    >`
      SELECT sr.paid, sr.expires_at, l.email
      FROM shared_reports sr
      LEFT JOIN website_audit_leads l ON l.id = sr.lead_id
      WHERE sr.short_id = ${shortId}
      LIMIT 1
    `;
    const report = rows[0];
    if (!report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }
    if (report.paid) {
      return NextResponse.json({ error: 'Already unlocked', alreadyPaid: true }, { status: 409 });
    }
    if (new Date() > new Date(report.expires_at)) {
      return NextResponse.json({ error: 'This roadmap has expired' }, { status: 410 });
    }

    // Publishable key is returned to the client so it can init Stripe.js at
    // runtime (NEXT_PUBLIC_* would be baked at build, which the Docker build
    // can't do). Safe to expose.
    const publishableKey = process.env.STRIPE_PUBLISHABLE_KEY;
    if (!publishableKey) {
      return NextResponse.json({ error: 'Payments are not fully configured yet.' }, { status: 503 });
    }

    const domain = process.env.RAILWAY_PUBLIC_DOMAIN || 'roadmap.leftrightlabs.com';
    const base = `https://${domain}`;

    // Embedded checkout: the form renders inside our own branded modal, so the
    // buyer never leaves the site. On completion Stripe redirects the page to
    // return_url, where the existing ?checkout=success polling takes over.
    const session = await getStripe().checkout.sessions.create({
      mode: 'payment',
      ui_mode: 'embedded_page',
      ...(report.email ? { customer_email: report.email } : {}),
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: 'usd',
            unit_amount: FULL_ROADMAP_PRICE_CENTS,
            product_data: {
              name: 'Brand Roadmap: Full Unlock',
              description:
                'Every move for all nine areas, your full 30/60/90-day plan, example rewrites, and a downloadable PDF.',
            },
          },
        },
      ],
      // shortId drives the unlock; leadEmail keeps the AC paid-tag on the same
      // contact we tagged at report completion (Stripe lets the buyer edit the
      // email field, so we don't rely on customer_details for AC).
      metadata: { shortId, leadEmail: report.email ?? '' },
      return_url: `${base}/start/report/${shortId}?checkout=success`,
    });

    return NextResponse.json({ clientSecret: session.client_secret, publishableKey });
  } catch (err) {
    console.error('[CREATE-CHECKOUT] error:', err);
    return NextResponse.json({ error: 'Could not start checkout' }, { status: 500 });
  }
}
