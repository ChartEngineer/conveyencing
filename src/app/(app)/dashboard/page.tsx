import Link from "next/link";
import { prisma } from "@/lib/db";
import { STAGES, fmtMoney, fmtDate } from "@/lib/constants";
import { PriorityBadge } from "@/components/badges";
import BarChart from "@/components/bar-chart";
import { requireNavAccess } from "@/lib/dal";

export default async function DashboardPage() {
  await requireNavAccess("dashboard");

  const in3Days = new Date();
  in3Days.setDate(in3Days.getDate() + 3);

  const [
    active,
    closed,
    invoicesByStatus,
    tasksDue,
    avgDaysResult,
    matterCountsByStage,
    activeMatterCountsByStage,
    activeMatters,
    upcomingTasks,
    kycPending,
    clientCount,
    propertyCount,
  ] = await Promise.all([
    prisma.matter.count({ where: { status: "ACTIVE" } }),
    prisma.matter.count({ where: { status: "CLOSED" } }),
    prisma.invoice.groupBy({ by: ["status"], _sum: { feesCents: true, disbursementsCents: true }, _count: true }),
    prisma.task.count({ where: { status: { not: "DONE" }, dueDate: { lte: in3Days } } }),
    prisma.$queryRaw<
      { avg_days: number | null }[]
    >`SELECT AVG(EXTRACT(EPOCH FROM ("updatedAt" - "openedDate")) / 86400) AS avg_days FROM "Matter" WHERE status = 'CLOSED'`,
    prisma.matter.groupBy({ by: ["stageIndex"], _count: true }),
    prisma.matter.groupBy({ by: ["stageIndex"], where: { status: "ACTIVE" }, _count: true }),
    prisma.matter.findMany({
      where: { status: "ACTIVE" },
      include: { property: true, clients: { include: { client: true } } },
      orderBy: { createdAt: "desc" },
      take: 6,
    }),
    prisma.task.findMany({ where: { status: { not: "DONE" } }, orderBy: { dueDate: "asc" }, take: 6 }),
    prisma.client.count({ where: { kyc: { not: "VERIFIED" } } }),
    prisma.client.count(),
    prisma.property.count(),
  ]);

  const revenue = invoicesByStatus
    .filter((g) => g.status === "PAID")
    .reduce((s, g) => s + (g._sum.feesCents ?? 0) + (g._sum.disbursementsCents ?? 0), 0);
  const outstanding = invoicesByStatus
    .filter((g) => g.status !== "PAID")
    .reduce((s, g) => s + (g._sum.feesCents ?? 0) + (g._sum.disbursementsCents ?? 0), 0);
  const overdueCount = invoicesByStatus.find((g) => g.status === "OVERDUE")?._count ?? 0;

  const avgDays = avgDaysResult[0]?.avg_days != null ? Math.round(Number(avgDaysResult[0].avg_days)) : 58;

  const countByStage = (rows: { stageIndex: number; _count: number }[]) => (idx: number) => rows.find((r) => r.stageIndex === idx)?._count ?? 0;
  const totalCount = countByStage(matterCountsByStage);
  const activeCount = countByStage(activeMatterCountsByStage);

  const stageCounts = STAGES.map((s, i) => ({ label: s, value: totalCount(i) }));
  const bottlenecks = STAGES.map((s, i) => ({ stage: s, count: activeCount(i) }))
    .filter((b) => b.count > 0)
    .sort((a, b) => b.count - a.count);

  return (
    <>
      {clientCount === 0 && propertyCount === 0 && (
        <div className="card mb16">
          <h3>Get started</h3>
          <div className="small muted mb16">A matter needs a client and a property. Three steps to your first one:</div>
          <div className="grid grid-3">
            <div>
              <div className="small" style={{ fontWeight: 600 }}>
                1. Register a client
              </div>
              <div className="small muted mb12">The buyer, seller, or bank on the transfer.</div>
              <Link className="btn btn-primary btn-sm" href="/clients/new">
                + Register Client
              </Link>
            </div>
            <div>
              <div className="small" style={{ fontWeight: 600 }}>
                2. Register the property
              </div>
              <div className="small muted mb12">Stand number, title deed, survey diagram.</div>
              <Link className="btn btn-primary btn-sm" href="/properties/new">
                + Register Property
              </Link>
            </div>
            <div>
              <div className="small" style={{ fontWeight: 600 }}>
                3. Open the matter
              </div>
              <div className="small muted mb12">Link the parties and property, assign a practitioner.</div>
              <Link className="btn btn-primary btn-sm" href="/matters/new">
                + New Matter
              </Link>
            </div>
          </div>
        </div>
      )}
      <div className="grid grid-4 mb16">
        <div className="card stat-card">
          <div className="label">Active Matters</div>
          <div className="value">{active}</div>
        </div>
        <div className="card stat-card">
          <div className="label">Completed Transfers</div>
          <div className="value">{closed}</div>
        </div>
        <div className="card stat-card">
          <div className="label">Revenue Collected</div>
          <div className="value">{fmtMoney(revenue)}</div>
        </div>
        <div className="card stat-card">
          <div className="label">Outstanding Balance</div>
          <div className="value">{fmtMoney(outstanding)}</div>
          <div className="delta down">{overdueCount} overdue invoice(s)</div>
        </div>
      </div>

      <div className="grid grid-2 mb16">
        <div className="card">
          <h3>Matters by Stage</h3>
          <BarChart data={stageCounts.map((s) => ({ label: s.label.replace(" ", "\n"), value: s.value }))} />
        </div>
        <div className="card">
          <h3>Bottlenecks</h3>
          {bottlenecks.length ? (
            bottlenecks.map((b) => (
              <div className="flex-between mb8" key={b.stage}>
                <span className="small">{b.stage}</span>
                <span className="badge badge-amber">{b.count} matter(s)</span>
              </div>
            ))
          ) : (
            <div className="empty small">No active matters.</div>
          )}
          <div className="mt16" style={{ borderTop: "1px solid var(--border)", paddingTop: 12 }}>
            <div className="flex-between small mb8">
              <span className="muted">Avg. days to completion</span>
              <b>{avgDays} days</b>
            </div>
            <div className="flex-between small mb8">
              <span className="muted">Tasks due (next 3 days)</span>
              <b>{tasksDue}</b>
            </div>
            <div className="flex-between small">
              <span className="muted">Client KYC pending</span>
              <b>{kycPending}</b>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-2">
        <div className="card">
          <div className="flex-between mb12">
            <h3 style={{ margin: 0 }}>Active Matters</h3>
            <Link className="btn btn-ghost btn-sm" href="/matters">
              View all →
            </Link>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Ref</th>
                  <th>Property</th>
                  <th>Parties</th>
                  <th>Stage</th>
                  <th>Progress</th>
                </tr>
              </thead>
              <tbody>
                {activeMatters.map((m) => (
                  <tr key={m.id} className="row-link">
                    <td>
                      <Link href={`/matters/${m.id}`}>
                        <b>{m.reference}</b>
                      </Link>
                    </td>
                    <td>{m.property.standNo}</td>
                    <td>{m.clients.map((c) => c.client.name).join(" & ")}</td>
                    <td>{STAGES[m.stageIndex]}</td>
                    <td style={{ width: 120 }}>
                      <div className="progress-bar">
                        <div style={{ width: `${Math.round((m.stageIndex / 10) * 100)}%` }} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="card">
          <div className="flex-between mb12">
            <h3 style={{ margin: 0 }}>Upcoming Tasks</h3>
            <Link className="btn btn-ghost btn-sm" href="/tasks">
              View all →
            </Link>
          </div>
          {upcomingTasks.map((t) => (
            <div className="flex-between mb12" key={t.id}>
              <div>
                <div className="small" style={{ fontWeight: 600 }}>
                  {t.title}
                </div>
                <div className="small muted">
                  {t.assigneeName} • Due {fmtDate(t.dueDate)}
                </div>
              </div>
              <PriorityBadge priority={t.priority} />
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
