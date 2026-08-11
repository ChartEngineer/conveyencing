import AiChatClient from "./chat-client";
import { requireNavAccess } from "@/lib/dal";
import { getSubscription } from "@/lib/entitlements";

export default async function AiAssistantPage() {
  await requireNavAccess("ai");
  const subscription = await getSubscription();
  const remaining = Math.max(0, subscription.aiCreditsLimit - subscription.aiCreditsUsed);

  return (
    <>
      <div className="demo-banner">
        This assistant has two modes: conveyancing operations and Zimbabwe intellectual-property research. IP research
        is citation-first and identifies points requiring current-law verification. Its answers are general information
        only: a registered Zimbabwean legal practitioner must review anything before reliance. <b>Premium add-on</b>{" "}
        {remaining} of {subscription.aiCreditsLimit} credits remaining this period.
      </div>
      <AiChatClient />
    </>
  );
}
