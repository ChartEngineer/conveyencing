import { prisma } from "@/lib/db";
import DocumentGeneratorClient from "./generator-client";
import { resolveSellerAndBuyer, type DocMatterData } from "@/lib/document-templates";
import { requireNavAccess } from "@/lib/dal";

export default async function DocumentsPage() {
  await requireNavAccess("documents");

  const matters = await prisma.matter.findMany({
    include: { property: true, clients: { include: { client: true } }, responsible: true },
    orderBy: { createdAt: "desc" },
  });

  const data: (DocMatterData & { id: string })[] = matters.map((m) => {
    const { seller, buyer } = resolveSellerAndBuyer(m.clients.map((c) => c.client));
    return {
      id: m.id,
      reference: m.reference,
      type: m.type,
      priceCents: m.priceCents,
      openedDate: m.openedDate.toISOString(),
      responsibleName: m.responsible.name,
      property: {
        standNo: m.property.standNo,
        suburb: m.property.suburb,
        city: m.property.city,
        titleDeedNo: m.property.titleDeedNo,
        surveyDiagram: m.property.surveyDiagram,
        size: m.property.size,
      },
      seller: { name: seller?.name ?? "—", idNumber: seller?.idNumber ?? "—", address: seller?.address ?? "—" },
      buyer: { name: buyer?.name ?? "—", idNumber: buyer?.idNumber ?? "—", address: buyer?.address ?? "—" },
      partiesComplete: Boolean(seller && buyer),
    };
  });

  return (
    <>
      <div className="demo-banner">
        Documents are generated from live matter data. Preview, copy, or download — always reviewed and signed off by a
        registered legal practitioner before use.
      </div>
      <DocumentGeneratorClient matters={data} />
    </>
  );
}
