import { NextResponse } from "next/server";
import Stripe from "stripe";
import { SUBSCRIPTIONS_ENABLED } from "@/lib/flags";

/**
 * Stripe webhook scaffold. Inert while SUBSCRIPTIONS_ENABLED=false. When a
 * future BuiltFit+ tier launches, subscription lifecycle events land here to
 * flip non-core feature flags for the user — never to gate core tracking.
 */
export async function POST(request: Request) {
  if (!SUBSCRIPTIONS_ENABLED) {
    return NextResponse.json(
      { received: true, note: "Subscriptions are disabled at launch." },
      { status: 200 }
    );
  }

  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!secret || !key) {
    return NextResponse.json({ error: "Stripe is not configured" }, { status: 500 });
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  const stripe = new Stripe(key);
  let event: Stripe.Event;
  try {
    const body = await request.text();
    event = await stripe.webhooks.constructEventAsync(body, signature, secret);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed":
    case "customer.subscription.updated":
    case "customer.subscription.deleted":
      // TODO(BuiltFit+): persist subscription state and enable plus-only,
      // non-core features for the user. Core tracking is free forever and
      // must never be touched from here (see lib/flags.ts contract).
      break;
    default:
      break;
  }

  return NextResponse.json({ received: true });
}
