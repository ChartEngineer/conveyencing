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
        This assistant is backed by Claude and can see a summary of the firm&apos;s current matters. Its answers are
        general information only — always have a registered legal practitioner review anything before it is relied
        upon. <b>Premium add-on</b> — {remaining} of {subscription.aiCreditsLimit} credits remaining this period.
        OCR of scanned deeds/IDs, document comparison, and clause suggestions are planned premium features, not yet
        enabled.
      </div>
      <AiChatClient />
    </>
  );
}
