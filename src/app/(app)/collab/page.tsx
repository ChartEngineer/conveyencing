import { requireNavAccess } from "@/lib/dal";
import { prisma } from "@/lib/db";
import { STAGES, fmtDate } from "@/lib/constants";
import { sendMessage } from "@/app/actions/messages";
import EmptyState from "@/components/empty-state";

export default async function CollabPage() {
  const user = await requireNavAccess("collab");

  const links = await prisma.matterCollaborator.findMany({
    where: { userId: user.id, status: "ACCEPTED" },
    include: {
      matter: {
        include: {
          property: true,
          responsible: true,
          clients: { include: { client: true } },
          documentChecks: true,
          messages: { include: { sender: true }, orderBy: { createdAt: "asc" } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  if (links.length === 0) {
    return (
      <div className="card">
        <EmptyState title="No shared matters yet" hint="A firm will invite you here once they grant you access to a matter." />
      </div>
    );
  }

  return (
    <>
      {links.map(({ id: linkId, matter }) => {
        const stageName = STAGES[matter.stageIndex];
        const sendMessageWithId = sendMessage.bind(null, matter.id);

        return (
          <div key={linkId} className="mb16">
            <div className="card mb16">
              <h3>
                {matter.reference} — {matter.property.standNo}
              </h3>
              <div className="small muted mb16">
                {matter.property.suburb}, {matter.property.city} · {matter.type.replace("_", " ")} · Responsible:{" "}
                {matter.responsible.name}
              </div>
              <div className="stepper">
                {STAGES.map((s, i) => (
                  <div key={s} className={`step ${i < matter.stageIndex ? "done" : ""} ${i === matter.stageIndex ? "current" : ""}`}>
                    <div className="line" />
                    <div className="dot">{i < matter.stageIndex ? "✓" : i + 1}</div>
                    <div className="lbl">{s}</div>
                  </div>
                ))}
              </div>
              <div className="small mt16">
                <span className="muted">Current stage:</span> <b>{stageName}</b>
              </div>
            </div>
            <div className="grid grid-2">
              <div className="card">
                <h3>Parties</h3>
                {matter.clients.map(({ client }) => (
                  <div key={client.id} className="flex-between mb8">
                    <span className="small">{client.name}</span>
                    <span className="badge badge-blue">{client.role}</span>
                  </div>
                ))}
                <h3 className="mt20">Document Checklist</h3>
                {matter.documentChecks.map((d) => (
                  <div key={d.id} className="flex-between mb8">
                    <span className="small">{d.name}</span>
                    {d.done ? <span className="badge badge-green">Done</span> : <span className="badge badge-gray">Pending</span>}
                  </div>
                ))}
              </div>
              <div className="card">
                <h3>Messages</h3>
                <div className="mb12" style={{ maxHeight: 260, overflowY: "auto" }}>
                  {matter.messages.length === 0 && <div className="empty small">No messages yet.</div>}
                  {matter.messages.map((m) => (
                    <div key={m.id} className={`chatline ${m.senderId === user.id ? "user" : "ai"}`}>
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
            </div>
          </div>
        );
      })}
    </>
  );
}
