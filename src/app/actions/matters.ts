"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { verifySession } from "@/lib/dal";
import { STAGES, STAGE_META } from "@/lib/constants";

export async function advanceStage(matterId: string) {
  await verifySession();
  const matter = await prisma.matter.findUniqueOrThrow({ where: { id: matterId } });
  if (matter.stageIndex >= STAGES.length - 1) return;

  const nextIndex = matter.stageIndex + 1;
  const nextStage = STAGES[nextIndex];

  await prisma.$transaction([
    prisma.matter.update({
      where: { id: matterId },
      data: { stageIndex: nextIndex, status: nextIndex >= STAGES.length - 1 ? "CLOSED" : "ACTIVE" },
    }),
    prisma.matterDocumentCheck.createMany({
      data: STAGE_META[nextStage].docs.map((name) => ({ matterId, stage: nextStage, name })),
    }),
  ]);

  const session = await verifySession();
  await prisma.matterNote.create({
    data: { matterId, authorId: session.userId, text: `Advanced to stage: ${nextStage}.` },
  });
  await prisma.auditLogEntry.create({
    data: { userId: session.userId, action: `Advanced ${matter.reference} to stage: ${nextStage}` },
  });

  revalidatePath(`/matters/${matterId}`);
  revalidatePath("/matters");
  revalidatePath("/dashboard");
}

export async function toggleDocCheck(checkId: string, matterId: string) {
  await verifySession();
  const check = await prisma.matterDocumentCheck.findUniqueOrThrow({ where: { id: checkId } });
  await prisma.matterDocumentCheck.update({ where: { id: checkId }, data: { done: !check.done } });
  revalidatePath(`/matters/${matterId}`);
}

export async function addNote(matterId: string, formData: FormData) {
  const session = await verifySession();
  const text = String(formData.get("text") || "").trim();
  if (!text) return;
  await prisma.matterNote.create({ data: { matterId, authorId: session.userId, text } });
  revalidatePath(`/matters/${matterId}`);
}

export async function createMatter(formData: FormData) {
  const session = await verifySession();

  const type = String(formData.get("type")) as "SALE" | "PURCHASE" | "BOND_REGISTRATION";
  const propertyId = String(formData.get("propertyId"));
  const clientIds = formData.getAll("clientIds").map(String).filter(Boolean);
  const priceCents = Math.round(Number(formData.get("price") || 0) * 100);
  const priority = String(formData.get("priority")) as "HIGH" | "MEDIUM" | "LOW";
  const responsibleId = String(formData.get("responsibleId"));

  const count = await prisma.matter.count();
  const reference = `D360/2026/${String(1000 + count + 1).padStart(3, "0")}`;
  const firstStage = STAGES[0];

  const matter = await prisma.matter.create({
    data: {
      reference,
      type,
      propertyId,
      priceCents,
      priority,
      responsibleId,
      openedDate: new Date(),
      clients: { create: clientIds.map((clientId) => ({ clientId })) },
      documentChecks: { create: STAGE_META[firstStage].docs.map((name) => ({ stage: firstStage, name })) },
      notes: { create: { authorId: session.userId, text: "Matter opened and file created." } },
    },
  });

  revalidatePath("/matters");
  redirect(`/matters/${matter.id}`);
}
