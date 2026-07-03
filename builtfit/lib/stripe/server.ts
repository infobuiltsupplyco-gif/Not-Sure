import "server-only";
import Stripe from "stripe";
import { SUBSCRIPTIONS_ENABLED } from "@/lib/flags";

/**
 * Stripe scaffold. Subscriptions are OFF at launch — everything core is free
 * forever. These helpers exist so a future BuiltFit+ tier (non-core extras
 * only) can be wired up without touching product code.
 */

export function isStripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

export function getStripe(): Stripe {
  if (!SUBSCRIPTIONS_ENABLED) {
    throw new Error(
      "Subscriptions are disabled (SUBSCRIPTIONS_ENABLED=false). BuiltFit core is free forever."
    );
  }
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY is not configured.");
  return new Stripe(key);
}

/** Create a Checkout session for BuiltFit+ (future, non-core extras only). */
export async function createCheckoutSession(
  customerEmail: string,
  priceId: string,
  origin: string
): Promise<string | null> {
  const stripe = getStripe();
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer_email: customerEmail,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${origin}/settings?upgraded=1`,
    cancel_url: `${origin}/settings`,
  });
  return session.url;
}
