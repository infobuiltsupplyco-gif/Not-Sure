/**
 * Plan configuration. At launch there is exactly one live plan: Free, with
 * everything included. BuiltFit+ is a scaffold for the future and is hidden
 * while SUBSCRIPTIONS_ENABLED is false.
 */

export interface Plan {
  id: "free" | "plus";
  name: string;
  priceMonthlyUsd: number;
  stripePriceId: string | null;
  live: boolean;
  features: string[];
}

export const PLANS: Plan[] = [
  {
    id: "free",
    name: "BuiltFit Free",
    priceMonthlyUsd: 0,
    stripePriceId: null,
    live: true,
    features: [
      "Unlimited food diary with verified data",
      "Barcode scanning",
      "Full macro & micro breakdowns",
      "Custom goals with safety floor",
      "Recipes & meals",
      "Exercise logging (honest ranges)",
      "Progress charts & photos",
      "Weekly insights",
      "Gentle Mode",
      "CSV export of all your data",
    ],
  },
  {
    id: "plus",
    name: "BuiltFit+",
    priceMonthlyUsd: 4.99,
    stripePriceId: process.env.STRIPE_PLUS_PRICE_ID ?? null,
    live: false,
    features: [
      "AI meal suggestions",
      "Advanced analytics themes",
      "Everything in Free — always",
    ],
  },
];
