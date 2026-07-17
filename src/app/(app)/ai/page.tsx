import { prisma } from "@/lib/db";
import AiChatClient from "./chat-client";
import type { AiMatterSummary } from "@/lib/ai-faq";
import { requireNavAccess } from "@/lib/dal";

export default async function AiAssistantPage() {
  await requireNavAccess("ai");

  const matters = await prisma.matter.findMany({
    include: { property: true, clients: { include: { client: true } }, responsible: true },
    orderBy: { createdAt: "desc" },
  });

  const summaries: AiMatterSummary[] = matters.map((m) => ({
    reference: m.reference,
    standNo: m.property.standNo,
    suburb: m.property.suburb,
    parties: m.clients.map((c) => c.client.name).join(" & "),
    priceCents: m.priceCents,
    stageIndex: m.stageIndex,
    responsibleName: m.responsible.name,
    priority: m.priority,
  }));

  return (
    <>
      <div className="demo-banner">
        Demo mode: this assistant uses a small set of rule-based sample answers about the Zimbabwe conveyancing process — it
        is not connected to a live LLM. In production this module would call an LLM with OCR and document review
        capability, and all output would remain advisory, reviewed and approved by a registered legal practitioner before
        use.
      </div>
      <AiChatClient matters={summaries} />
    </>
  );
}
