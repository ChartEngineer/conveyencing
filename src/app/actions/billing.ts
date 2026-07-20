"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/dal";
import { getSubscription } from "@/lib/entitlements";
import { logAudit } from "@/lib/audit";
import type { PlanTier } from "@/lib/plans";

// TODO: connect a local payment provider (e.g. Paynow, EcoCash, or a card processor) here. Until
// then, plan changes are applied manually by an administrator after an out-of-band arrangement
// (bank transfer, invoice, etc.) — this does not process any payment and stores no payment
// credentials. See COMPLIANCE-NOTES.md.
export async function setPlanTier(formData: FormData) {
  const user = await getCurrentUser();
  if (user.role !== "ADMINISTRATOR") {
    throw new Error("Only administrators can change the plan.");
  }

  const tier = String(formData.get("tier")) as PlanTier;
  const subscription = await getSubscription();
  await prisma.subscription.update({ where: { id: subscription.id }, data: { tier, status: "active" } });

  await logAudit(user.id, `Changed plan tier to ${tier}`);
  revalidatePath("/", "layout");
}
