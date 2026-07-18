import Link from "next/link";
import { prisma } from "@/lib/db";
import { STAGES, fmtMoney } from "@/lib/constants";
import { StageBadge, PriorityBadge } from "@/components/badges";
import { requireNavAccess } from "@/lib/dal";
import { canViewSensitiveData } from "@/lib/permissions";
import Pagination from "@/components/pagination";
import EmptyState from "@/components/empty-state";

const PAGE_SIZE = 20;

export default async function MattersPage({ searchParams }: { searchParams: Promise<{ filter?: string; page?: string }> }) {
  const user = await requireNavAccess("matters");
  const canViewPrice = canViewSensitiveData(user.role);
  const { filter = "All", page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);

  const where = filter === "Active" ? { status: "ACTIVE" as const } : filter === "Closed" ? { status: "CLOSED" as const } : {};

  const [matters, total, clientCount, propertyCount] = await Promise.all([
    prisma.matter.findMany({
      where,
      include: { property: true, clients: { include: { client: true } }, responsible: true },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.matter.count({ where }),
    prisma.client.count(),
    prisma.property.count(),
  ]);

  const filters = ["All", "Active", "Closed"];

  return (
    <>
      <div className="flex-between mb16">
        <div className="flex gap8">
          {filters.map((f) => (
            <Link key={f} href={f === "All" ? "/matters" : `/matters?filter=${f}`} className={`pill-btn ${filter === f ? "active" : ""}`}>
              {f}
            </Link>
          ))}
        </div>
        <Link className="btn btn-primary" href="/matters/new">
          + New Matter
        </Link>
      </div>
      {total === 0 ? (
        <div className="card">
          {clientCount === 0 || propertyCount === 0 ? (
            <EmptyState
              title="No matters yet"
              hint="A matter needs at least one client and one property. Register those first, then create your first matter."
              actionHref={clientCount === 0 ? "/clients/new" : "/properties/new"}
              actionLabel={clientCount === 0 ? "Register Client" : "Register Property"}
            />
          ) : (
            <EmptyState
              title={filter === "All" ? "No matters yet" : `No ${filter.toLowerCase()} matters`}
              hint={filter === "All" ? "Create your first matter to start tracking a transfer." : undefined}
              actionHref="/matters/new"
              actionLabel="+ New Matter"
            />
          )}
        </div>
      ) : (
      <>
      <div className="card" style={{ padding: 0 }}>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Ref</th>
                <th>Type</th>
                <th>Property</th>
                <th>Parties</th>
                <th>Price</th>
                <th>Stage</th>
                <th>Progress</th>
                <th>Priority</th>
                <th>Responsible</th>
              </tr>
            </thead>
            <tbody>
              {matters.map((m) => (
                <tr key={m.id} className="row-link">
                  <td>
                    <Link href={`/matters/${m.id}`}>
                      <b>{m.reference}</b>
                    </Link>
                  </td>
                  <td>{m.type.replace("_", " ")}</td>
                  <td>
                    {m.property.standNo}
                    <div className="small muted">
                      {m.property.suburb}, {m.property.city}
                    </div>
                  </td>
                  <td>{m.clients.map((c) => c.client.name).join(" & ")}</td>
                  <td>{canViewPrice ? fmtMoney(m.priceCents) : <span className="muted">Restricted</span>}</td>
                  <td>
                    <StageBadge idx={m.stageIndex} />
                    <div className="small muted mt8">{STAGES[m.stageIndex]}</div>
                  </td>
                  <td style={{ width: 110 }}>
                    <div className="progress-bar">
                      <div style={{ width: `${Math.round((m.stageIndex / 10) * 100)}%` }} />
                    </div>
                  </td>
                  <td>
                    <PriorityBadge priority={m.priority} />
                  </td>
                  <td>{m.responsible.name}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <Pagination page={page} pageSize={PAGE_SIZE} total={total} basePath="/matters" extraParams={{ filter }} />
      </>
      )}
    </>
  );
}
