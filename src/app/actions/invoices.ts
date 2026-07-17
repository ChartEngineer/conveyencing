"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { verifySession } from "@/lib/dal";
import { logAudit } from "@/lib/audit";

export async function setInvoiceStatus(invoiceId: string, status: "OUTSTANDING" | "PAID" | "OVERDUE") {
  const session = await verifySession();
  const invoice = await prisma.invoice.update({ where: { id: invoiceId }, data: { status }, include: { matter: true } });
  await logAudit(session.userId, `Marked invoice as ${status} — ${invoice.matter.reference}`);
  revalidatePath("/financials");
  revalidatePath("/dashboard");
}
