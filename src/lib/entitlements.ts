import "server-only";
import { prisma } from "@/lib/db";
import { tierAtLeast, type PlanTier } from "@/lib/plans";

// Singleton row — this app is single-tenant per deployment (one instance = one firm), so there's
// exactly one Subscription record, at the fixed id "singleton" (see the schema's @default).
// Uses upsert (a single atomic INSERT ... ON CONFLICT) rather than findFirst-then-create, since
// the latter raced under concurrent access and created duplicate rows in production.
export async function getSubscription() {
  return prisma.subscription.upsert({
    where: { id: "singleton" },
    create: {},
    update: {},
  });
}

export type GatedFeature = "financials" | "compliance" | "multiBranch" | "auditExport";

const FEATURE_MIN_TIER: Record<GatedFeature, PlanTier> = {
  financials: "PRACTICE",
  compliance: "PRACTICE",
  multiBranch: "FIRM",
  auditExport: "FIRM",
};

export function canUseFeature(subscriptionTier: PlanTier, feature: GatedFeature): boolean {
  return tierAtLeast(subscriptionTier, FEATURE_MIN_TIER[feature]);
}
