import { requireNavAccess } from "@/lib/dal";
import { prisma } from "@/lib/db";
import { STAGES, fmtDate } from "@/lib/constants";
import { InvoiceStatusBadge } from "@/components/badges";
import { uploadMatterFile } from "@/app/actions/files";
import { sendMessage } from "@/app/actions/messages";

function formatBytes(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

export default async function ClientPortalPage() {
  const user = await requireNavAccess("portal");

  const clientProfile = await prisma.client.findUnique({ where: { portalUserId: user.id } });

  if (!clientProfile) {
    return <div className="empty">No client profile is linked to this account yet. Please contact your conveyancer.</div>;
  }

  const matters = await prisma.matter.findMany({
    where: { clients: { some: { clientId: clientProfile.id } } },
    include: {
      property: true,
      invoices: true,
      documentChecks: { include: { files: true } },
      messages: { include: { sender: true }, orderBy: { createdAt: "asc" } },
    },
    orderBy: { createdAt: "desc" },
  });

  if (matters.length === 0) {
    return <div className="empty">You have no active matters yet.</div>;
  }

  return (
    <>
      {matters.map((m) => {
        const outstandingDocs = m.documentChecks.filter((d) => !d.done);
        const uploadedDocs = m.documentChecks.filter((d) => d.files.length > 0);
        const stageName = STAGES[m.stageIndex];
        const generalUploadWithIds = uploadMatterFile.bind(null, m.id, null);
        const sendMessageWithId = sendMessage.bind(null, m.id);

        return (
          <div key={m.id} className="mb16">
            <div className="card mb16">
              <h3>
                Your Matter: {m.reference} — {m.property.standNo}
              </h3>
              <div className="small muted mb16">
                {m.property.suburb}, {m.property.city} · {m.type.replace("_", " ")}
              </div>
              <div className="stepper">
                {STAGES.map((s, i) => (
                  <div key={s} className={`step ${i < m.stageIndex ? "done" : ""} ${i === m.stageIndex ? "current" : ""}`}>
                    <div className="line" />
                    <div className="dot">{i < m.stageIndex ? "✓" : i + 1}</div>
                    <div className="lbl">{s}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="grid grid-2">
              <div className="card">
                <h3>Documents</h3>
                {uploadedDocs.length ? (
                  uploadedDocs.map((d) => (
                    <div className="mb12" key={d.id}>
                      <div className="flex-between">
                        <span className="small">{d.name}</span>
                        <span className="badge badge-green">Received</span>
                      </div>
                      {d.files.map((f) => (
                        <div key={f.id} className="small muted">
                          <a href={`/api/files/${f.id}`}>{f.fileName}</a> ({formatBytes(f.sizeBytes)})
                        </div>
                      ))}
                    </div>
                  ))
                ) : (
                  <div className="empty small">No documents exchanged yet.</div>
                )}

                {outstandingDocs.length > 0 && (
                  <>
                    <h3 className="mt20">Outstanding for {stageName}</h3>
                    {outstandingDocs
                      .filter((d) => d.stage === stageName)
                      .map((d) => {
                        const uploadWithIds = uploadMatterFile.bind(null, m.id, d.id);
                        return (
                          <form key={d.id} action={uploadWithIds} className="flex gap8 mb8" style={{ alignItems: "center" }}>
                            <span className="small" style={{ flex: 1 }}>
                              {d.name}
                            </span>
                            <input type="file" name="file" accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.png,.jpg,.jpeg,.gif,.webp" required style={{ fontSize: 12 }} />
                            <button type="submit" className="btn btn-ghost btn-sm">
                              Upload
                            </button>
                          </form>
                        );
                      })}
                  </>
                )}

                <h3 className="mt20">Upload Another Document</h3>
                <form action={generalUploadWithIds} className="field flex gap8">
                  <input type="file" name="file" required style={{ fontSize: 12 }} />
                  <button type="submit" className="btn btn-ghost btn-sm">
                    Upload
                  </button>
                </form>
              </div>
              <div className="card">
                <h3>Invoices</h3>
                {m.invoices.length ? (
                  m.invoices.map((i) => (
                    <div className="flex-between mb8" key={i.id}>
                      <span className="small">{i.description}</span>
                      <InvoiceStatusBadge status={i.status} />
                    </div>
                  ))
                ) : (
                  <div className="empty small">No invoices yet.</div>
                )}
                <h3 className="mt20">Secure Chat</h3>
                <div className="mb12" style={{ maxHeight: 220, overflowY: "auto" }}>
                  {m.messages.length === 0 && <div className="empty small">No messages yet.</div>}
                  {m.messages.map((msg) => (
                    <div key={msg.id} className={`chatline ${msg.sender.role === "CLIENT" ? "user" : "ai"}`}>
                      <div>{msg.body}</div>
                      <div className="small" style={{ opacity: 0.7, marginTop: 4 }}>
                        {msg.sender.name} • {fmtDate(msg.createdAt)}
                      </div>
                    </div>
                  ))}
                </div>
                <form key={m.messages.length} action={sendMessageWithId} className="flex gap8">
                  <input className="searchbox" name="body" style={{ flex: 1, width: "auto" }} placeholder="Message your conveyancer..." required />
                  <button className="btn btn-primary" type="submit">
                    Send
                  </button>
                </form>
              </div>
            </div>
          </div>
        );
      })}
    </>
  );
}
