import Link from "next/link";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { prisma } from "@/lib/db";
import { STAGES, STAGE_META, fmtMoney, fmtDate, addDays, COLLABORATOR_ROLE_LABELS } from "@/lib/constants";
import { PriorityBadge, KycBadge } from "@/components/badges";
import { advanceStage, toggleDocCheck, addNote } from "@/app/actions/matters";
import { uploadMatterFile } from "@/app/actions/files";
import { sendMessage } from "@/app/actions/messages";
import { inviteCollaborator, revokeCollaborator } from "@/app/actions/collaborators";
import { requireNavAccess } from "@/lib/dal";
import { canViewSensitiveData } from "@/lib/permissions";

function formatBytes(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

export default async function MatterDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ invited?: string }>;
}) {
  const user = await requireNavAccess("matters");
  const canViewSensitive = canViewSensitiveData(user.role);
  const { id } = await params;
  const { invited } = await searchParams;

  const matter = await prisma.matter.findUnique({
    where: { id },
    include: {
      property: true,
      responsible: true,
      clients: { include: { client: true } },
      documentChecks: { include: { files: true } },
      notes: { include: { author: true }, orderBy: { createdAt: "desc" } },
      messages: { include: { sender: true }, orderBy: { createdAt: "asc" } },
      collaborators: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!matter) notFound();

  let inviteLink: string | null = null;
  if (invited && canViewSensitive) {
    const justInvited = matter.collaborators.find((c) => c.id === invited);
    if (justInvited) {
      const host = (await headers()).get("host");
      const protocol = host?.startsWith("localhost") ? "http" : "https";
      inviteLink = host ? `${protocol}://${host}/invite/${justInvited.inviteToken}` : `/invite/${justInvited.inviteToken}`;
    }
  }

  const stageName = STAGES[matter.stageIndex];
  const meta = STAGE_META[stageName];
  const daysElapsed = STAGES.slice(0, matter.stageIndex + 1).reduce((s, st) => s + STAGE_META[st].days, 0);
  const target = addDays(matter.openedDate, daysElapsed);
  const stageDocs = matter.documentChecks.filter((d) => d.stage === stageName);

  const advanceStageWithId = advanceStage.bind(null, matter.id);
  const addNoteWithId = addNote.bind(null, matter.id);
  const sendMessageWithId = sendMessage.bind(null, matter.id);

  return (
    <>
      <Link href="/matters" className="small muted" style={{ textDecoration: "none" }}>
        ← Back to matters
      </Link>
      <div className="flex-between mt12 mb16">
        <div>
          <h2 style={{ fontSize: 20 }}>
            {matter.reference} — {matter.property.standNo}
          </h2>
          <div className="small muted mt8">
            {matter.type.replace("_", " ")} • Opened {fmtDate(matter.openedDate)} • Responsible: {matter.responsible.name}{" "}
            <PriorityBadge priority={matter.priority} />
          </div>
        </div>
        <div className="flex gap8">
          <Link className="btn btn-ghost" href="/documents">
            Generate Document
          </Link>
          {matter.stageIndex < STAGES.length - 1 ? (
            <form action={advanceStageWithId}>
              <button className="btn btn-gold" type="submit">
                Advance to next stage →
              </button>
            </form>
          ) : (
            <span className="badge badge-green">Matter Closed</span>
          )}
        </div>
      </div>

      <div className="card mb16">
        <h3>Conveyancing Workflow</h3>
        <div className="stepper">
          {STAGES.map((s, i) => (
            <div key={s} className={`step ${i < matter.stageIndex ? "done" : ""} ${i === matter.stageIndex ? "current" : ""}`}>
              <div className="line" />
              <div className="dot">{i < matter.stageIndex ? "✓" : i + 1}</div>
              <div className="lbl">{s}</div>
            </div>
          ))}
        </div>
        <div className="grid grid-3 mt16">
          <div className="small">
            <span className="muted">Current stage:</span> <b>{stageName}</b>
          </div>
          <div className="small">
            <span className="muted">Responsible role:</span> <b>{meta.role}</b>
          </div>
          <div className="small">
            <span className="muted">Target date this stage:</span> <b>{fmtDate(target)}</b>
          </div>
        </div>
      </div>

      <div className="grid grid-2">
        <div className="card">
          <h3>Required Documents — {stageName}</h3>
          {stageDocs.map((d) => {
            const toggleWithIds = toggleDocCheck.bind(null, d.id, matter.id);
            const uploadWithIds = uploadMatterFile.bind(null, matter.id, d.id);
            return (
              <div key={d.id} className="mb12" style={{ borderBottom: "1px dashed var(--border)", paddingBottom: 10 }}>
                <div className="flex" style={{ alignItems: "center", gap: 8 }}>
                  <form action={toggleWithIds}>
                    <button type="submit" className={`chk ${d.done ? "on" : ""}`}>
                      {d.done ? "✓" : ""}
                    </button>
                  </form>
                  <span className="small" style={d.done ? { textDecoration: "line-through", color: "var(--muted)" } : undefined}>
                    {d.name}
                  </span>
                </div>
                {d.files.length > 0 && (
                  <div className="mt8" style={{ marginLeft: 24 }}>
                    {d.files.map((f) => (
                      <div key={f.id} className="small">
                        <a href={`/api/files/${f.id}`}>{f.fileName}</a> <span className="muted">({formatBytes(f.sizeBytes)})</span>
                      </div>
                    ))}
                  </div>
                )}
                <form action={uploadWithIds} className="mt8 flex gap8" style={{ marginLeft: 24 }}>
                  <input type="file" name="file" accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.png,.jpg,.jpeg,.gif,.webp" required style={{ fontSize: 12 }} />
                  <button type="submit" className="btn btn-ghost btn-sm">
                    Upload
                  </button>
                </form>
              </div>
            );
          })}
          <h3 className="mt20">Parties</h3>
          {matter.clients.map(({ client }) => (
            <div key={client.id} className="flex-between mb12" style={{ border: "1px solid var(--border)", borderRadius: 8, padding: "10px 12px" }}>
              <div>
                <b className="small">{client.name}</b>
                <div className="small muted">{client.role}{canViewSensitive && client.idNumber ? ` • ${client.idNumber}` : ""}</div>
              </div>
              <KycBadge kyc={client.kyc} />
            </div>
          ))}
          <h3 className="mt20">Property</h3>
          <div className="small">
            <b>{matter.property.standNo}</b>
            <br />
            {matter.property.suburb}, {matter.property.city}
            <br />
            Title Deed: {matter.property.titleDeedNo}
            {canViewSensitive && (
              <>
                <br />
                Valuation: {fmtMoney(matter.property.valuationCents)}
              </>
            )}
          </div>
        </div>

        <div className="card">
          <h3>Notes &amp; Timeline</h3>
          <form key={matter.notes.length} action={addNoteWithId} className="field">
            <textarea name="text" placeholder="Add a note or update..." required />
            <button className="btn btn-primary btn-sm mt8" type="submit">
              Add Note
            </button>
          </form>
          {matter.notes.map((n) => (
            <div className="timeline-item" key={n.id}>
              <div className="timeline-dot" />
              <div>
                <div className="small">{n.text}</div>
                <div className="small muted">
                  {n.author.name} • {fmtDate(n.createdAt)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="card mt16">
        <h3>Messages with Client</h3>
        <div className="mb12" style={{ maxHeight: 260, overflowY: "auto" }}>
          {matter.messages.length === 0 && <div className="empty small">No messages yet.</div>}
          {matter.messages.map((m) => (
            <div key={m.id} className={`chatline ${m.sender.role === "CLIENT" || m.sender.role === "COLLABORATOR" ? "ai" : "user"}`}>
              <div>{m.body}</div>
              <div className="small" style={{ opacity: 0.7, marginTop: 4 }}>
                {m.sender.name} • {fmtDate(m.createdAt)}
              </div>
            </div>
          ))}
        </div>
        <form key={matter.messages.length} action={sendMessageWithId} className="flex gap8">
          <input className="searchbox" name="body" style={{ flex: 1, width: "auto" }} placeholder="Write a message..." required />
          <button className="btn btn-primary" type="submit">
            Send
          </button>
        </form>
      </div>

      {canViewSensitive && (
        <div className="card mt16">
          <h3>Collaborators</h3>
          <div className="small muted mb16">
            Invite the other side&apos;s lawyer or the bank to see this matter&apos;s stage, parties, document checklist,
            and exchange messages — nothing else (no price, no trust ledger, no other matters).
          </div>

          {inviteLink && (
            <div className="mb16" style={{ background: "var(--amber-bg)", border: "1px solid #f1d9ab", borderRadius: 8, padding: 12 }}>
              <div className="small" style={{ fontWeight: 600, marginBottom: 4 }}>
                Invite created — share this link (it isn&apos;t emailed automatically):
              </div>
              <div className="small" style={{ wordBreak: "break-all" }}>
                {inviteLink}
              </div>
            </div>
          )}

          {matter.collaborators.length === 0 && <div className="empty small">No collaborators invited yet.</div>}
          {matter.collaborators.map((c) => {
            const revokeWithIds = revokeCollaborator.bind(null, c.id, matter.id);
            return (
              <div key={c.id} className="flex-between mb12" style={{ border: "1px solid var(--border)", borderRadius: 8, padding: "10px 12px" }}>
                <div>
                  <b className="small">{c.name}</b>
                  <div className="small muted">
                    {c.email} • {COLLABORATOR_ROLE_LABELS[c.role]}
                  </div>
                </div>
                <div className="flex gap8" style={{ alignItems: "center" }}>
                  <span
                    className={`badge ${c.status === "ACCEPTED" ? "badge-green" : c.status === "PENDING" ? "badge-amber" : "badge-gray"}`}
                  >
                    {c.status}
                  </span>
                  {c.status !== "REVOKED" && (
                    <form action={revokeWithIds}>
                      <button className="btn btn-ghost btn-sm" type="submit">
                        Revoke
                      </button>
                    </form>
                  )}
                </div>
              </div>
            );
          })}

          <h3 className="mt20">Invite a Collaborator</h3>
          <form action={inviteCollaborator.bind(null, matter.id)} className="field-row">
            <div className="field">
              <label htmlFor="collab-name">Name</label>
              <input id="collab-name" name="name" required />
            </div>
            <div className="field">
              <label htmlFor="collab-email">Email</label>
              <input id="collab-email" name="email" type="email" required />
            </div>
            <div className="field">
              <label htmlFor="collab-role">Role</label>
              <select id="collab-role" name="role" defaultValue="OPPOSING_COUNSEL">
                <option value="OPPOSING_COUNSEL">Opposing Counsel</option>
                <option value="BANK">Bank</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
            <button className="btn btn-primary" type="submit" style={{ alignSelf: "flex-end" }}>
              Send Invite
            </button>
          </form>
        </div>
      )}
    </>
  );
}
