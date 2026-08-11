"use client";

import { useRef, useState, useTransition } from "react";
import { askAiAssistant } from "@/app/actions/ai";
import { CONVEYANCING_SUGGESTED_QUESTIONS } from "@/lib/ai-faq";
import { type AiAssistantMode, ZIMBABWE_IP_SOURCES, ZIMBABWE_IP_SUGGESTED_QUESTIONS } from "@/lib/zimbabwe-ip-research";

type ChatMessage = { role: "user" | "ai"; text: string };

export default function AiChatClient() {
  const [history, setHistory] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [mode, setMode] = useState<AiAssistantMode>("CONVEYANCING");
  const [isPending, startTransition] = useTransition();
  const logRef = useRef<HTMLDivElement>(null);
  const isIpMode = mode === "ZIMBABWE_IP";
  const suggestedQuestions = isIpMode ? ZIMBABWE_IP_SUGGESTED_QUESTIONS : CONVEYANCING_SUGGESTED_QUESTIONS;

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
      const answer = await askAiAssistant(q, mode);
      setHistory((h) => [...h, { role: "ai", text: answer }]);
      scrollToEnd();
    });
  }

  function selectMode(nextMode: AiAssistantMode) {
    if (nextMode === mode) return;
    setMode(nextMode);
    setHistory([]);
    setInput("");
  }

  return (
    <div className="grid grid-2">
      <div className="card" style={{ minHeight: 460, display: "flex", flexDirection: "column" }}>
        <div className="ai-chat-head">
          <div>
            <p className="ai-mode-label">Research mode</p>
            <h3>{isIpMode ? "Zimbabwe IP research" : "Conveyancing assistant"}</h3>
          </div>
          {isIpMode && <span className="badge badge-gold">Citation-first</span>}
        </div>
        <div className="ai-mode-switch" role="tablist" aria-label="Assistant research mode">
          <button
            className={`ai-mode-option ${!isIpMode ? "active" : ""}`}
            type="button"
            role="tab"
            aria-selected={!isIpMode}
            onClick={() => selectMode("CONVEYANCING")}
            disabled={isPending}
          >
            Conveyancing
          </button>
          <button
            className={`ai-mode-option ${isIpMode ? "active" : ""}`}
            type="button"
            role="tab"
            aria-selected={isIpMode}
            onClick={() => selectMode("ZIMBABWE_IP")}
            disabled={isPending}
          >
            Zimbabwe IP counsel
          </button>
        </div>
        <div ref={logRef} style={{ flex: 1, overflowY: "auto", margin: "10px 0", maxHeight: 340 }}>
          {history.length === 0 && (
            <div className="empty small">
              {isIpMode
                ? "Ask about trade marks, copyright, patents, designs, licensing, or an IP dispute research issue."
                : "Try: What is transfer duty? or Summarize the first matter."}
            </div>
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
            placeholder={isIpMode ? "Ask an IP research question..." : "Ask a question..."}
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
        <div className="ai-chat-head">
          <div>
            <p className="ai-mode-label">Start here</p>
            <h3>Suggested questions</h3>
          </div>
        </div>
        {suggestedQuestions.map((q) => (
          <div key={q} className="btn btn-ghost btn-sm mb8" style={{ display: "block", textAlign: "left" }} onClick={() => ask(q)}>
            {q}
          </div>
        ))}
        {isIpMode ? (
          <div className="ai-source-panel">
            <div className="small" style={{ fontWeight: 700 }}>
              Source register
            </div>
            <p className="small muted">Answers must identify the relevant source and flag points that need current-law verification.</p>
            <ul className="ai-source-list">
              {ZIMBABWE_IP_SOURCES.map((source) => (
                <li key={source.id}>
                  <a href={source.url} target="_blank" rel="noreferrer">
                    {source.title}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="mt16" style={{ borderTop: "1px solid var(--border)", paddingTop: 12 }}>
            <div className="small muted">
              Other planned AI capabilities (not enabled yet): OCR of scanned deeds/IDs, document comparison,
              missing-clause detection, clause suggestions, and predictive timelines based on historical matters.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
