"use client";

import { useRef, useState, useTransition } from "react";
import { askAiAssistant } from "@/app/actions/ai";
import { SUGGESTED_QUESTIONS } from "@/lib/ai-faq";

type ChatMessage = { role: "user" | "ai"; text: string };

export default function AiChatClient() {
  const [history, setHistory] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isPending, startTransition] = useTransition();
  const logRef = useRef<HTMLDivElement>(null);

  function scrollToEnd() {
    setTimeout(() => {
      if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
    }, 50);
  }

  function ask(question?: string) {
    const q = (question ?? input).trim();
    if (!q || isPending) return;
    setHistory((h) => [...h, { role: "user", text: q }]);
    setInput("");
    scrollToEnd();
    startTransition(async () => {
      const answer = await askAiAssistant(q);
      setHistory((h) => [...h, { role: "ai", text: answer }]);
      scrollToEnd();
    });
  }

  return (
    <div className="grid grid-2">
      <div className="card" style={{ minHeight: 460, display: "flex", flexDirection: "column" }}>
        <h3>Ask the Assistant</h3>
        <div ref={logRef} style={{ flex: 1, overflowY: "auto", margin: "10px 0", maxHeight: 340 }}>
          {history.length === 0 && (
            <div className="empty small">Try: &quot;What is transfer duty?&quot; or &quot;Summarize the first matter&quot;</div>
          )}
          {history.map((m, i) => (
            <div className={`chatline ${m.role}`} key={i}>
              {m.text}
            </div>
          ))}
          {isPending && <div className="chatline ai small muted">Thinking…</div>}
        </div>
        <div className="flex gap8">
          <input
            className="searchbox"
            style={{ flex: 1, width: "auto" }}
            placeholder="Ask a question..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && ask()}
            disabled={isPending}
          />
          <button className="btn btn-primary" onClick={() => ask()} disabled={isPending}>
            Send
          </button>
        </div>
      </div>
      <div className="card">
        <h3>Suggested Questions</h3>
        {SUGGESTED_QUESTIONS.map((q) => (
          <div key={q} className="btn btn-ghost btn-sm mb8" style={{ display: "block", textAlign: "left" }} onClick={() => ask(q)}>
            {q}
          </div>
        ))}
        <div className="mt16" style={{ borderTop: "1px solid var(--border)", paddingTop: 12 }}>
          <div className="small muted">
            Other planned AI capabilities (not enabled yet): OCR of scanned deeds/IDs, document comparison,
            missing-clause detection, clause suggestions, and predictive timelines based on historical matters.
          </div>
        </div>
      </div>
    </div>
  );
}
