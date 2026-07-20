import "server-only";
import { prisma } from "@/lib/db";
import { tierAtLeast, type PlanTier } from "@/lib/plans";

// Singleton row — this app is single-tenant per deployment (one instance = one firm), so there's
// exactly one Subscription record, created lazily on first read.
export async function getSubscription() {
  const existing = await prisma.subscription.findFirst();
  if (existing) return existing;
  return prisma.subscription.create({ data: {} });
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
