"use client";

import { loadStripe, type Stripe } from "@stripe/stripe-js";
import { EmbeddedCheckoutProvider, EmbeddedCheckout } from "@stripe/react-stripe-js";
import { X } from "lucide-react";
import Image from "next/image";

// Cache Stripe instances per publishable key. The key is loaded at runtime
// (returned by the create-checkout API) rather than via NEXT_PUBLIC_*, which
// would be baked at build time where Railway env vars aren't available.
const stripeCache = new Map<string, Promise<Stripe | null>>();
function getStripePromise(pk: string): Promise<Stripe | null> {
  let p = stripeCache.get(pk);
  if (!p) {
    p = loadStripe(pk);
    stripeCache.set(pk, p);
  }
  return p;
}

/**
 * The $97 unlock, embedded in an LRL-branded modal so the buyer stays on-site.
 * The navy header carries the white logo; Stripe renders its (PCI-safe) card
 * form in the light body. On completion Stripe redirects to the session's
 * return_url (the report with ?checkout=success).
 */
export function CheckoutModal({
  clientSecret,
  publishableKey,
  onClose,
}: {
  clientSecret: string;
  publishableKey: string;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex overflow-y-auto bg-[#0a1430]/80 backdrop-blur-sm p-4 md:p-8"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Checkout"
    >
      <div
        className="relative w-full max-w-[560px] m-auto rounded-2xl overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Branded header */}
        <div className="bg-[#112248] px-6 pt-5 pb-6">
          <div className="flex items-center justify-between mb-4">
            <Image
              src="/images/logos/LRL_Logo_2025_White.svg"
              alt="Left Right Labs"
              width={110}
              height={31}
              style={{ height: 28, width: "auto" }}
            />
            <button
              onClick={onClose}
              aria-label="Close checkout"
              className="text-white/60 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <p className="text-[13px] font-bold uppercase tracking-[0.12em] text-[#a7c140]">
            Unlock your full roadmap
          </p>
          <p className="text-white/60 text-sm mt-1.5 leading-relaxed">
            Every move for all nine areas, your full 30 / 60 / 90-day plan, example rewrites, and a downloadable PDF.
          </p>
        </div>

        {/* Stripe embedded form (light) */}
        <div className="bg-white p-3 md:p-5">
          <EmbeddedCheckoutProvider
            stripe={getStripePromise(publishableKey)}
            options={{ clientSecret }}
          >
            <EmbeddedCheckout />
          </EmbeddedCheckoutProvider>
        </div>
      </div>
    </div>
  );
}
