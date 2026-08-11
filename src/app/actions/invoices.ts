"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireNavAccess } from "@/lib/dal";
import { logAudit } from "@/lib/audit";

export async function setInvoiceStatus(invoiceId: string, status: "OUTSTANDING" | "PAID" | "OVERDUE") {
  // Server Actions can be called without first loading /financials, so enforce both its role
  // and plan entitlement here rather than relying on the page-level guard alone.
  const session = await requireNavAccess("financials");
  const invoice = await prisma.invoice.update({ where: { id: invoiceId }, data: { status }, include: { matter: true } });
  await logAudit(session.userId, `Marked invoice as ${status} — ${invoice.matter.reference}`);
  revalidatePath("/financials");
  revalidatePath("/dashboard");
}
