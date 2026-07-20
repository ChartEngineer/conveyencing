export type PlanTier = "SOLO" | "PRACTICE" | "FIRM";

export type PlanDefinition = {
  tier: PlanTier;
  name: string;
  /** US$ per practitioner per month. null means "Contact us" (custom/enterprise pricing). */
  priceUsdPerSeat: number | null;
  seatRange: string;
  features: string[];
};

// Placeholder pricing — not researched against any real market data. Adjust before these are
// ever shown to a real prospective customer.
export const PLANS: Record<PlanTier, PlanDefinition> = {
  SOLO: {
    tier: "SOLO",
    name: "Solo / Small Practice",
    priceUsdPerSeat: 19,
    seatRange: "1–3 users",
    features: [
      "Matters & the full transfer workflow",
      "Document generator",
      "Client portal",
      "Free trial: 1 active matter",
    ],
  },
  PRACTICE: {
    tier: "PRACTICE",
    name: "Practice",
    priceUsdPerSeat: 39,
    seatRange: "Unlimited users",
    features: [
      "Everything in Solo",
      "Financials & trust accounting",
      "Compliance — KYC/AML, audit trail",
      "Multi-party collaboration (invite counsel, banks)",
    ],
  },
  FIRM: {
    tier: "FIRM",
    name: "Firm / Enterprise",
    priceUsdPerSeat: null,
    seatRange: "Multi-branch",
    features: [
      "Everything in Practice",
      "Multi-branch support & audit export",
      "Priority support",
      "Deeds Office / bank / estate-agent integrations",
      "White-label client portal",
    ],
  },
};

export const TIER_ORDER: PlanTier[] = ["SOLO", "PRACTICE", "FIRM"];

export function tierAtLeast(tier: PlanTier, minTier: PlanTier): boolean {
  return TIER_ORDER.indexOf(tier) >= TIER_ORDER.indexOf(minTier);
}
