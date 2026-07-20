"use server";

import { getCurrentUser } from "@/lib/dal";
import { prisma } from "@/lib/db";
import { anthropic } from "@/lib/anthropic";
import { STAGES, fmtMoney } from "@/lib/constants";
import { getSubscription } from "@/lib/entitlements";

const SYSTEM_PROMPT = `You are the AI assistant embedded in Deeds360, a legal practice management system used by a Zimbabwean conveyancing firm.

You help staff with general questions about the Zimbabwe property transfer / conveyancing process (transfer duty, rates clearance, ZIMRA tax clearance, Deeds Office procedure, due diligence documents, typical timelines) and with questions about the firm's current matters, which are listed below.

Keep answers concise and practical. Always make clear that your answers are general information, not legal advice, and that a registered legal practitioner must review anything before it is relied upon. If asked something outside the conveyancing / legal-practice-management scope, say so briefly and redirect the user to their practitioner.`;

export async function askAiAssistant(question: string): Promise<string> {
  await getCurrentUser();

  const trimmed = question.trim();
  if (!trimmed) return "Please enter a question.";

  const subscription = await getSubscription();
  if (subscription.aiCreditsUsed >= subscription.aiCreditsLimit) {
    return "You've used all of this billing period's AI Assistant credits. Ask your administrator to upgrade the plan (Settings → Billing), or contact us to add more.";
  }

  const matters = await prisma.matter.findMany({
    include: { property: true, clients: { include: { client: true } }, responsible: true },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  const matterContext =
    matters
      .map(
        (m) =>
          `${m.reference}: ${m.property.standNo}, ${m.property.suburb}. Parties: ${m.clients
            .map((c) => c.client.name)
            .join(" & ")}. Price: ${fmtMoney(m.priceCents)}. Stage: ${STAGES[m.stageIndex]} (${m.stageIndex + 1}/${STAGES.length}). Responsible: ${m.responsible.name}. Priority: ${m.priority}.`,
      )
      .join("\n") || "(no matters in the system yet)";

  try {
    const response = await anthropic.messages.create({
      model: "claude-opus-4-8",
      max_tokens: 1024,
      system: `${SYSTEM_PROMPT}\n\nCurrent matters in the system:\n${matterContext}`,
      messages: [{ role: "user", content: trimmed }],
    });

    const textBlock = response.content.find((block) => block.type === "text");
    // Only meter on a successful response — a dropped/errored call shouldn't cost a credit.
    await prisma.subscription.update({ where: { id: subscription.id }, data: { aiCreditsUsed: { increment: 1 } } });
    return textBlock?.text || "I wasn't able to generate a response. Please try again.";
  } catch {
    return "The AI assistant is temporarily unavailable. Please try again shortly, or consult your practitioner directly.";
  }
}
