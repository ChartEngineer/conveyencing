"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { verifySession } from "@/lib/dal";
import { STAGES, STAGE_META, STAFF_ROLE_LABELS } from "@/lib/constants";

// Administrator/Partner may advance any stage regardless of the stage's assigned role — but
// unlike before, that's now an explicit, logged override rather than silently indistinguishable
// from a normal in-role advance (see the note/audit text below).
const OVERRIDE_ROLES = new Set(["ADMINISTRATOR", "PARTNER"]);

export async function advanceStage(matterId: string) {
  const session = await verifySession();
  const matter = await prisma.matter.findUniqueOrThrow({ where: { id: matterId } });
  if (matter.stageIndex >= STAGES.length - 1) return;

  const currentStage = STAGES[matter.stageIndex];
  const requiredRole = STAGE_META[currentStage].role;
  const isOverride = session.role !== requiredRole && OVERRIDE_ROLES.has(session.role);

  if (session.role !== requiredRole && !isOverride) {
    redirect(`/matters/${matterId}?stageError=role`);
  }

  const incompleteDocs = await prisma.matterDocumentCheck.count({
    where: { matterId, stage: currentStage, done: false },
  });
  if (incompleteDocs > 0) {
    redirect(`/matters/${matterId}?stageError=docs`);
  }

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

  const noteText = isOverride
    ? `Advanced to stage: ${nextStage} (override by ${STAFF_ROLE_LABELS[session.role]} — normally requires ${STAFF_ROLE_LABELS[requiredRole]}).`
    : `Advanced to stage: ${nextStage}.`;
  await prisma.matterNote.create({ data: { matterId, authorId: session.userId, text: noteText } });
  await prisma.auditLogEntry.create({
    data: {
      userId: session.userId,
      action: isOverride
        ? `Advanced ${matter.reference} to stage: ${nextStage} (role override)`
        : `Advanced ${matter.reference} to stage: ${nextStage}`,
    },
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

// Powers the guided New Matter wizard (matters/new/wizard.tsx): unlike createMatter below, this
// can register a new client and/or new property inline instead of requiring both to already
// exist. Runs as one transaction so a failure partway through (e.g. matter creation) doesn't
// leave an orphaned client or property behind.
export async function createMatterFromWizard(formData: FormData) {
  const session = await verifySession();

  const matterId = await prisma.$transaction(async (tx) => {
    let clientIds = formData.getAll("clientIds").map(String).filter(Boolean);

    if (formData.get("newClientName")) {
      const name = String(formData.get("newClientName") || "").trim();
      if (name) {
        const existing = await tx.client.findFirst({ where: { name: { equals: name, mode: "insensitive" } } });
        const newClient = await tx.client.create({
          data: {
            name,
            role: String(formData.get("newClientRole") || "BUYER") as "BUYER" | "SELLER" | "BOTH" | "BANK",
            idNumber: String(formData.get("newClientIdNumber") || "") || null,
            phone: String(formData.get("newClientPhone") || "") || null,
            email: String(formData.get("newClientEmail") || "") || null,
            address: String(formData.get("newClientAddress") || "") || null,
            conflict: !!existing,
          },
        });
        clientIds = [...clientIds, newClient.id];
      }
    }

    let propertyId = String(formData.get("propertyId") || "");
    if (formData.get("newStandNo")) {
      const newProperty = await tx.property.create({
        data: {
          standNo: String(formData.get("newStandNo") || "Unnamed stand"),
          suburb: String(formData.get("newSuburb") || "—"),
          city: String(formData.get("newCity") || "Harare"),
          titleDeedNo: String(formData.get("newTitleDeedNo") || "Pending"),
          surveyDiagram: String(formData.get("newSurveyDiagram") || "Pending"),
          size: String(formData.get("newSize") || "—"),
          valuationCents: Math.round(Number(formData.get("newValuation") || 0) * 100),
          gps: String(formData.get("newGps") || "—"),
          owners: { create: { ownerName: "Unknown", fromYear: new Date().getFullYear() } },
        },
      });
      propertyId = newProperty.id;
    }

    if (!propertyId || clientIds.length === 0) {
      throw new Error("A matter needs at least one party and a property.");
    }

    const type = String(formData.get("type")) as "SALE" | "PURCHASE" | "BOND_REGISTRATION";
    const priceCents = Math.round(Number(formData.get("price") || 0) * 100);
    const priority = String(formData.get("priority")) as "HIGH" | "MEDIUM" | "LOW";
    const responsibleId = String(formData.get("responsibleId"));

    const count = await tx.matter.count();
    const reference = `D360/2026/${String(1000 + count + 1).padStart(3, "0")}`;
    const firstStage = STAGES[0];

    const matter = await tx.matter.create({
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

    return matter.id;
  });

  revalidatePath("/matters");
  redirect(`/matters/${matterId}`);
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
