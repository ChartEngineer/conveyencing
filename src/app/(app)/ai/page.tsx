import AiChatClient from "./chat-client";
import { requireNavAccess } from "@/lib/dal";

export default async function AiAssistantPage() {
  await requireNavAccess("ai");

  return (
    <>
      <div className="demo-banner">
        This assistant is backed by Claude and can see a summary of the firm&apos;s current matters. Its answers are
        general information only — always have a registered legal practitioner review anything before it is relied
        upon. OCR of scanned deeds/IDs, document comparison, and clause suggestions are planned but not yet enabled.
      </div>
      <AiChatClient />
    </>
  );
}
