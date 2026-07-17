"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { verifySession } from "@/lib/dal";
import { logAudit } from "@/lib/audit";
import { fmtMoney } from "@/lib/constants";

export type RecordTrustTransactionState = { error?: string } | undefined;

export async function recordTrustTransaction(
  _prevState: RecordTrustTransactionState,
  formData: FormData,
): Promise<RecordTrustTransactionState> {
  const session = await verifySession();

  const matterId = String(formData.get("matterId") || "");
  const type = String(formData.get("type")) as "DEPOSIT" | "PAYMENT_OUT";
  const description = String(formData.get("description") || "").trim();
  const dollars = Number(formData.get("amount"));

  if (!matterId || !description || !Number.isFinite(dollars) || dollars <= 0) {
    return { error: "Please select a matter, enter a description, and a positive amount." };
  }

  const matter = await prisma.matter.findUnique({ where: { id: matterId } });
  if (!matter) {
    return { error: "Matter not found." };
  }

  const amountCents = Math.round(dollars * 100) * (type === "PAYMENT_OUT" ? -1 : 1);

  if (type === "PAYMENT_OUT") {
    const agg = await prisma.trustTransaction.aggregate({
      where: { matterId },
      _sum: { amountCents: true },
    });
    const currentBalance = agg._sum.amountCents ?? 0;
    if (currentBalance + amountCents < 0) {
      return {
        error: `This payment would take the trust balance for ${matter.reference} negative (current balance: ${fmtMoney(currentBalance)}). Trust accounts may never run negative.`,
      };
    }
  }

  await prisma.trustTransaction.create({
    data: { matterId, type, amountCents, date: new Date(), description },
  });

  await logAudit(
    session.userId,
    `Recorded trust ${type === "DEPOSIT" ? "deposit" : "payment out"} of ${fmtMoney(Math.abs(amountCents))} for ${matter.reference}: ${description}`,
  );

  revalidatePath("/financials");
  return undefined;
}
