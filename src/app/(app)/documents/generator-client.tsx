"use client";

import { useState } from "react";
import { DOC_TEMPLATES, generateDocument, type DocMatterData } from "@/lib/document-templates";
import EmptyState from "@/components/empty-state";

export default function DocumentGeneratorClient({ matters }: { matters: (DocMatterData & { id: string })[] }) {
  const [matterId, setMatterId] = useState(matters[0]?.id ?? "");
  const [doc, setDoc] = useState<{ title: string; body: string } | null>(null);

  const matter = matters.find((m) => m.id === matterId);

  if (matters.length === 0) {
    return (
      <div className="card">
        <EmptyState
          title="No matters yet"
          hint="Documents are generated from a matter's data — create a matter first."
          actionHref="/matters/new"
          actionLabel="+ New Matter"
        />
      </div>
    );
  }

  function open(templateId: string) {
    if (!matter) return;
    setDoc(generateDocument(templateId, matter));
  }

  function copyText() {
    if (doc) navigator.clipboard?.writeText(doc.body);
  }

  function download() {
    if (!doc || !matter) return;
    const blob = new Blob([doc.body], { type: "text/plain" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${doc.title.replace(/[^a-z0-9]/gi, "_")}_${matter.reference.split("/").join("-")}.txt`;
    a.click();
  }

  function print() {
    if (!doc) return;
    const w = window.open("", "_blank");
    if (!w) return;
    w.document.write(
      `<html><head><title>${doc.title}</title><style>body{font-family:Georgia,serif;white-space:pre-wrap;padding:40px;font-size:13px;line-height:1.6;}</style></head><body>${doc.body
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")}</body></html>`,
    );
    w.document.close();
    w.focus();
    setTimeout(() => w.print(), 300);
  }

  return (
    <>
      <div className="field mb20" style={{ maxWidth: 420 }}>
        <label htmlFor="doc-matter">Select a matter to generate documents for</label>
        <select id="doc-matter" value={matterId} onChange={(e) => setMatterId(e.target.value)}>
          {matters.map((m) => (
            <option key={m.id} value={m.id}>
              {m.reference} — {m.property.standNo}
            </option>
          ))}
        </select>
      </div>
      <div className="grid grid-4">
        {DOC_TEMPLATES.map((t) => (
          <div className="doc-card" key={t.id} onClick={() => open(t.id)}>
            <div className="ic">{t.icon}</div>
            <div className="small" style={{ fontWeight: 600 }}>
              {t.name}
            </div>
          </div>
        ))}
      </div>

      {doc && (
        <div className="overlay" onClick={(e) => e.target === e.currentTarget && setDoc(null)}>
          <div className="modal wide">
            <div className="modal-head">
              <h3>
                {doc.title} — {matter?.reference}
              </h3>
              <button className="x-close" onClick={() => setDoc(null)}>
                &times;
              </button>
            </div>
            <div className="modal-body">
              <div className="doc-preview">{doc.body}</div>
            </div>
            <div className="modal-foot">
              <button className="btn btn-ghost" onClick={() => setDoc(null)}>
                Close
              </button>
              <button className="btn btn-ghost" onClick={copyText}>
                Copy Text
              </button>
              <button className="btn btn-gold" onClick={download}>
                Download .txt
              </button>
              <button className="btn btn-primary" onClick={print}>
                Print / Save as PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
