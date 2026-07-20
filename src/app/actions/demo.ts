"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/dal";
import { logAudit } from "@/lib/audit";
import { STAGES, STAGE_META } from "@/lib/constants";

export async function seedDemoData() {
  const user = await getCurrentUser();
  if (user.role !== "ADMINISTRATOR") {
    throw new Error("Only administrators can seed demo data.");
  }

  await prisma.$transaction(async (tx) => {
    const buyer = await tx.client.create({
      data: {
        name: "Rutendo Chikafu",
        role: "BUYER",
        idNumber: "63-1122334-A-45",
        phone: "+263 77 123 4567",
        email: "rutendo.chikafu@example.com",
        address: "14 Fife Avenue, Harare",
        kyc: "VERIFIED",
        isDemo: true,
      },
    });
    const seller = await tx.client.create({
      data: {
        name: "Farai Moyo",
        role: "SELLER",
        idNumber: "63-5566778-B-12",
        phone: "+263 71 987 6543",
        email: "farai.moyo@example.com",
        address: "8 Enterprise Road, Harare",
        kyc: "VERIFIED",
        isDemo: true,
      },
    });

    const property = await tx.property.create({
      data: {
        standNo: "Stand 245 Borrowdale",
        suburb: "Borrowdale",
        city: "Harare",
        titleDeedNo: "DT 1123/2019",
        surveyDiagram: "SG 4456/2018",
        size: "2,400 m²",
        valuationCents: 18500000,
        gps: "-17.7431, 31.0876",
        isDemo: true,
        owners: { create: { ownerName: seller.name, fromYear: 2019 } },
      },
    });

    const matter = await tx.matter.create({
      data: {
        reference: "DEMO/2026/001",
        type: "SALE",
        propertyId: property.id,
        priceCents: 18500000,
        stageIndex: 2,
        priority: "HIGH",
        responsibleId: user.id,
        openedDate: new Date(),
        isDemo: true,
        clients: { create: [{ clientId: buyer.id }, { clientId: seller.id }] },
        documentChecks: {
          create: [
            ...STAGE_META[STAGES[0]].docs.map((name) => ({ stage: STAGES[0], name, done: true })),
            ...STAGE_META[STAGES[1]].docs.map((name) => ({ stage: STAGES[1], name, done: true })),
            ...STAGE_META[STAGES[2]].docs.map((name) => ({ stage: STAGES[2], name })),
          ],
        },
        notes: { create: { authorId: user.id, text: "Demo matter opened and file created." } },
      },
    });

    await tx.task.createMany({
      data: [
        {
          title: "Request Deeds Office search",
          matterId: matter.id,
          assigneeName: user.name,
          role: "Conveyancing Secretary",
          dueDate: new Date(Date.now() + 3 * 86400000),
          priority: "HIGH",
          isDemo: true,
        },
        {
          title: "Follow up on ZIMRA tax clearance",
          matterId: matter.id,
          assigneeName: user.name,
          role: "Accounts Officer",
          dueDate: new Date(Date.now() + 7 * 86400000),
          priority: "MEDIUM",
          isDemo: true,
        },
      ],
    });

    await tx.invoice.create({
      data: {
        matterId: matter.id,
        clientId: buyer.id,
        description: "Conveyancing fees — Stand 245 Borrowdale",
        feesCents: 925000,
        disbursementsCents: 45000,
        status: "OUTSTANDING",
        date: new Date(),
        dueDate: new Date(Date.now() + 14 * 86400000),
        isDemo: true,
      },
    });
  });

  await logAudit(user.id, "Seeded demo data");
  revalidatePath("/", "layout");
}

export async function clearDemoData() {
  const user = await getCurrentUser();
  if (user.role !== "ADMINISTRATOR") {
    throw new Error("Only administrators can clear demo data.");
  }

  await prisma.$transaction(async (tx) => {
    const demoMatters = await tx.matter.findMany({ where: { isDemo: true }, select: { id: true } });
    const matterIds = demoMatters.map((m) => m.id);

    if (matterIds.length > 0) {
      await tx.message.deleteMany({ where: { matterId: { in: matterIds } } });
      await tx.matterFile.deleteMany({ where: { matterId: { in: matterIds } } });
      await tx.matterCollaborator.deleteMany({ where: { matterId: { in: matterIds } } });
      await tx.matterNote.deleteMany({ where: { matterId: { in: matterIds } } });
      await tx.matterDocumentCheck.deleteMany({ where: { matterId: { in: matterIds } } });
      await tx.trustTransaction.deleteMany({ where: { matterId: { in: matterIds } } });
      await tx.matterClient.deleteMany({ where: { matterId: { in: matterIds } } });
    }
    await tx.task.deleteMany({ where: { isDemo: true } });
    await tx.invoice.deleteMany({ where: { isDemo: true } });
    await tx.matter.deleteMany({ where: { isDemo: true } });

    const demoProperties = await tx.property.findMany({ where: { isDemo: true }, select: { id: true } });
    const propertyIds = demoProperties.map((p) => p.id);
    if (propertyIds.length > 0) {
      await tx.propertyOwner.deleteMany({ where: { propertyId: { in: propertyIds } } });
    }
    await tx.property.deleteMany({ where: { isDemo: true } });
    await tx.client.deleteMany({ where: { isDemo: true } });
  });

  await logAudit(user.id, "Cleared demo data");
  revalidatePath("/", "layout");
}
