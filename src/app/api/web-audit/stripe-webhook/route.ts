import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getStripe, stripeEnabled } from '@/lib/stripe';
import { markRoadmapPaid } from '@/lib/activecampaign';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Stripe webhook. This is the ONLY thing that flips a report to paid — the
// signed event is the source of truth, never the client or the success_url.
// Point a Stripe webhook endpoint at /api/web-audit/stripe-webhook for the
// `checkout.session.completed` event, and set STRIPE_WEBHOOK_SECRET (whsec_...).
export async function POST(request: NextRequest) {
  if (!stripeEnabled() || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Payments are not configured' }, { status: 503 });
  }

  const sig = request.headers.get('stripe-signature');
  if (!sig) {
    return NextResponse.json({ error: 'Missing stripe-signature' }, { status: 400 });
  }

  let event;
  try {
    // constructEvent requires the RAW request body. request.text() gives it to
    // us untouched in the App Router (no body parser in the way).
    const raw = await request.text();
    event = getStripe().webhooks.constructEvent(raw, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('[STRIPE-WEBHOOK] signature verification failed:', err instanceof Error ? err.message : err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as {
      metadata?: { shortId?: string; leadEmail?: string } | null;
      customer_email?: string | null;
      customer_details?: { email?: string | null } | null;
    };
    const shortId = session.metadata?.shortId;
    const email =
      session.metadata?.leadEmail ||
      session.customer_email ||
      session.customer_details?.email ||
      null;

    if (shortId) {
      try {
        // Flip to paid and stop the report from expiring — they own it now.
        await sql`
          UPDATE shared_reports
          SET paid = TRUE,
              expires_at = NOW() + INTERVAL '100 years',
              updated_at = NOW()
          WHERE short_id = ${shortId}
        `;
        console.log(`[STRIPE-WEBHOOK] unlocked report ${shortId}`);
      } catch (e) {
        // Return non-2xx so Stripe retries the delivery.
        console.error(`[STRIPE-WEBHOOK] DB update failed for ${shortId}:`, e);
        return NextResponse.json({ error: 'DB update failed' }, { status: 500 });
      }

      // Flip the AC tag unpaid -> paid (best-effort, non-blocking).
      if (email) {
        void markRoadmapPaid(email).catch((e) =>
          console.error('[STRIPE-WEBHOOK] AC markRoadmapPaid failed:', e)
        );
      }
    } else {
      console.warn('[STRIPE-WEBHOOK] checkout.session.completed with no shortId in metadata');
    }
  }

  return NextResponse.json({ received: true });
}
