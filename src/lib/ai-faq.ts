import { STAGES, fmtMoney } from "@/lib/constants";

export type AiMatterSummary = {
  reference: string;
  standNo: string;
  suburb: string;
  parties: string;
  priceCents: number;
  stageIndex: number;
  responsibleName: string;
  priority: string;
};

const AI_FAQ: { kw: string[]; a: string }[] = [
  {
    kw: ["transfer duty"],
    a: "Transfer duty is a tax payable to ZIMRA on the transfer of immovable property, calculated on a sliding scale based on the purchase price. It must be paid before the deed can be lodged at the Deeds Office. (This is general information — always confirm current rates with ZIMRA or a registered practitioner.)",
  },
  {
    kw: ["rates clearance"],
    a: "A rates clearance certificate confirms that municipal rates on a property are paid up to date. It is issued by the relevant local authority (e.g. City of Harare) and is required before transfer can proceed.",
  },
  {
    kw: ["due diligence", "documents needed", "what documents"],
    a: "Typical due diligence documents include: a Deeds Office search, a copy of the title deed, the survey diagram, confirmation of no outstanding bonds or caveats, and identification documents for all parties.",
  },
  {
    kw: ["how long", "registration take", "timeline"],
    a: "Registration at the Deeds Office typically takes several weeks after lodgement, depending on the office's workload and whether the file is complete. Delays are most often caused by outstanding clearances or missing documents — this system tracks those automatically per matter.",
  },
  {
    kw: ["tax clearance"],
    a: "A ZIMRA tax clearance certificate confirms that a seller (or company) has no outstanding tax obligations. It is generally required before proceeding to the rates clearance and transfer duty stages.",
  },
];

export function answerQuestion(question: string, matters: AiMatterSummary[]): string {
  const lower = question.toLowerCase();
  const refMatch = question.match(/MT-\d{4}|D360\/\d{4}\/\d{3}/i);

  if (lower.includes("summar")) {
    const m = refMatch ? matters.find((x) => x.reference.toUpperCase().includes(refMatch[0].toUpperCase())) : matters[0];
    if (!m) return "I could not find that matter reference.";
    return `Matter ${m.reference}: ${m.standNo}, ${m.suburb}. Parties: ${m.parties}. Price: ${fmtMoney(m.priceCents)}. Currently at stage "${
      STAGES[m.stageIndex]
    }" (${m.stageIndex + 1} of ${STAGES.length}). Responsible: ${m.responsibleName}. Priority: ${m.priority}.`;
  }

  for (const item of AI_FAQ) {
    if (item.kw.some((k) => lower.includes(k))) return item.a;
  }

  return "That's outside my demo knowledge base. In the full product this would be answered by a connected LLM with access to your matter data, then reviewed by a legal practitioner before being relied upon. For now, please consult your practitioner directly.";
}

export const SUGGESTED_QUESTIONS = [
  "What is transfer duty?",
  "What documents are needed for due diligence?",
  "How long does registration take?",
  "What is a rates clearance?",
  "Summarize the first matter",
];
