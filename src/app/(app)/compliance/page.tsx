import { prisma } from "@/lib/db";
import { STAGES } from "@/lib/constants";
import { KycBadge } from "@/components/badges";
import { requireNavAccess } from "@/lib/dal";

export default async function CompliancePage() {
  await requireNavAccess("compliance");

  const [clients, activeMatters, auditLog] = await Promise.all([
    prisma.client.findMany({ orderBy: { name: "asc" } }),
    prisma.matter.findMany({ where: { status: "ACTIVE" }, orderBy: { createdAt: "desc" } }),
    prisma.auditLogEntry.findMany({ include: { user: true }, orderBy: { ts: "desc" }, take: 30 }),
  ]);

  const CLEARANCE_STAGES = ["Tax Clearance", "Rates Clearance", "Transfer Duty"];

  return (
    <>
      <div className="grid grid-2 mb16">
        <div className="card">
          <h3>Client KYC / AML Status</h3>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Client</th>
                  <th>Role</th>
                  <th>ID Verified</th>
                  <th>AML Screening</th>
                </tr>
              </thead>
              <tbody>
                {clients.map((c) => (
                  <tr key={c.id}>
                    <td className="small">{c.name}</td>
                    <td className="small">{c.role}</td>
                    <td>
                      <KycBadge kyc={c.kyc} />
                    </td>
                    <td>{c.kyc === "VERIFIED" ? <span className="badge badge-green">Clear</span> : <span className="badge badge-amber">Pending</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {clients.length === 0 && <div className="empty small">No clients yet.</div>}
          </div>
        </div>
        <div className="card">
          <h3>Required Clearances — Active Matters</h3>
          {activeMatters.length === 0 && <div className="empty small">No active matters.</div>}
          {activeMatters.map((m) => (
            <div className="mb12" key={m.id}>
              <div className="small" style={{ fontWeight: 600 }}>
                {m.reference}
              </div>
              <div className="mt8">
                {CLEARANCE_STAGES.map((s) => {
                  const passed = STAGES.indexOf(s as (typeof STAGES)[number]) <= m.stageIndex;
                  return (
                    <span key={s} className={`badge ${passed ? "badge-green" : "badge-gray"}`} style={{ marginRight: 4 }}>
                      {s}
                      {passed ? " ✓" : ""}
                    </span>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="card">
        <h3>Audit Log</h3>
        {auditLog.length === 0 && <div className="empty small">No audit entries yet.</div>}
        {auditLog.map((a) => (
          <div className="timeline-item" key={a.id}>
            <div className="timeline-dot" />
            <div>
              <div className="small">{a.action}</div>
              <div className="small muted">
                {a.user.name} • {a.ts.toLocaleString("en-GB")}
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
