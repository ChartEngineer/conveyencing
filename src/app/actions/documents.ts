"use server";

import { prisma } from "@/lib/db";
import { verifySession } from "@/lib/dal";
import { getSubscription } from "@/lib/entitlements";

// Document generation itself is pure client-side (src/lib/document-templates.ts fills a template
// from matter data already on the page — no server round trip needed for the content itself).
// This action exists purely to meter usage: call it before rendering the preview, and only show
// the document if it reports allowed.
export async function recordDocGeneration(): Promise<{ allowed: boolean; remaining: number; limit: number }> {
  await verifySession();
  const subscription = await getSubscription();

  if (subscription.docCreditsUsed >= subscription.docCreditsLimit) {
    return { allowed: false, remaining: 0, limit: subscription.docCreditsLimit };
  }

  const updated = await prisma.subscription.update({
    where: { id: subscription.id },
    data: { docCreditsUsed: { increment: 1 } },
  });

  return { allowed: true, remaining: updated.docCreditsLimit - updated.docCreditsUsed, limit: updated.docCreditsLimit };
}
