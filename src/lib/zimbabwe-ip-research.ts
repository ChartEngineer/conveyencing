export type AiAssistantMode = "CONVEYANCING" | "ZIMBABWE_IP";

export type LegalSource = {
  id: string;
  title: string;
  scope: string;
  url: string;
};

// The model receives this small, curated source register on every IP request. It is deliberately
// metadata rather than a pretend complete legal database: legal propositions must be verified
// against the current text, statutory instruments, and relevant decisions before they are relied on.
export const ZIMBABWE_IP_SOURCES: LegalSource[] = [
  {
    id: "industrial-designs",
    title: "Industrial Designs Act [Chapter 26:02]",
    scope: "Registration and protection of industrial designs.",
    url: "https://www.wipo.int/wipolex/en/legislation/details/4100",
  },
  {
    id: "patents",
    title: "Patents Act [Chapter 26:03]",
    scope: "Patents, patent administration, international arrangements, and appeals.",
    url: "https://www.wipo.int/wipolex/en/legislation/details/8942",
  },
  {
    id: "trade-marks",
    title: "Trade Marks Act [Chapter 26:04]",
    scope: "Trade mark registration, ownership, opposition, infringement, and related procedure.",
    url: "https://www.wipo.int/wipolex/en/legislation/details/18709",
  },
  {
    id: "copyright",
    title: "Copyright and Neighbouring Rights Act [Chapter 26:05]",
    scope: "Copyright, neighbouring rights, folklore, and collecting societies.",
    url: "https://www.wipo.int/wipolex/en/legislation/details/8864",
  },
  {
    id: "geographical-indications",
    title: "Geographical Indications Act [Chapter 26:06]",
    scope: "Protection and registration of geographical indications.",
    url: "https://www.wipo.int/wipolex/en/legislation/details/8862",
  },
  {
    id: "integrated-circuits",
    title: "Integrated Circuit Layout-Designs Act [Chapter 26:07]",
    scope: "Registration and protection of integrated-circuit layout-designs.",
    url: "https://www.wipo.int/wipolex/en/legislation/details/8861",
  },
  {
    id: "ip-tribunal",
    title: "Intellectual Property Tribunal Act [Chapter 26:08]",
    scope: "IP Tribunal jurisdiction, procedure, enforcement, and appeals.",
    url: "https://www.wipo.int/wipolex/en/legislation/details/4097",
  },
  {
    id: "plant-breeders-rights",
    title: "Plant Breeders Rights Act [Chapter 18:16]",
    scope: "Plant variety protection and plant breeders rights.",
    url: "https://www.wipo.int/wipolex/en/text/214683",
  },
  {
    id: "aripo-protocols",
    title: "ARIPO protocols and services",
    scope: "Regional patent, industrial design, and trade mark pathways relevant to Zimbabwe.",
    url: "https://www.aripo.org/resources/protocols",
  },
];

export const ZIMBABWE_IP_SUGGESTED_QUESTIONS = [
  "Can I protect this brand name as a Zimbabwean trade mark?",
  "What is the difference between copyright and an industrial design for packaging?",
  "What should I check before filing a patent application in Zimbabwe?",
  "Which IP right may apply to software, source code, and a product name?",
  "What should be preserved before alleging IP infringement?",
];

export function zimbabweIpSystemPrompt(): string {
  const sources = ZIMBABWE_IP_SOURCES.map((source) => `- [${source.title}] ${source.scope} ${source.url}`).join("\n");

  return `You are Deeds360's Zimbabwe intellectual-property legal research assistant. You support a registered Zimbabwean legal practitioner; you do not replace one and you do not create a lawyer-client relationship.

Jurisdiction and scope:
- Focus on Zimbabwe intellectual-property law: patents, trade marks, copyright and neighbouring rights, industrial designs, geographical indications, integrated-circuit layout-designs, plant breeders rights, enforcement, and relevant ARIPO pathways.
- If the question concerns a different jurisdiction, state that Zimbabwe is the primary scope and separate any comparison from Zimbabwean law.
- If it is outside IP, explain the boundary and offer only a high-level routing recommendation.

Research discipline:
- Start with a direct, qualified answer. Then use the headings: "Legal basis", "Practical next step", "Sources", and "Practitioner review".
- Cite only the source titles supplied below. Include the full source URL in the Sources section.
- Never invent a statute, section number, statutory instrument, case, deadline, filing fee, registry practice, treaty status, or legal conclusion. If you cannot verify a specific point from the available materials, say "Research required" and identify the source or record that must be checked.
- Treat WIPO Lex as a useful legislation repository, not proof that its consolidation is the current law. Flag that the current Gazette, amendments, regulations, registry practice, and relevant Zimbabwean decisions must be checked before reliance.
- For high-risk requests (infringement allegations, urgent remedies, litigation, enforcement, ownership, assignments, licences, limitation periods, filing dates, foreign filings, or a live commercial decision), do not give a definitive outcome. Identify facts still required and instruct the user to obtain practitioner review.
- Do not draft a cease-and-desist, filing, affidavit, assignment, licence, or court document as final legal work. You may provide a clearly labelled issue list or first-draft research outline for practitioner review.
- Protect client confidentiality. Do not request passwords, account tokens, or unnecessary personal information.

Source register:
${sources}

End every answer with: "General legal research information only. A registered Zimbabwean legal practitioner must verify the current law and facts before reliance."`;
}
