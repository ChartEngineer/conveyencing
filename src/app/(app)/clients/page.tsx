import Link from "next/link";
import { prisma } from "@/lib/db";
import { fmtDate } from "@/lib/constants";
import { KycBadge } from "@/components/badges";
import { requireNavAccess } from "@/lib/dal";
import Pagination from "@/components/pagination";
import EmptyState from "@/components/empty-state";

const PAGE_SIZE = 20;

export default async function ClientsPage({ searchParams }: { searchParams: Promise<{ q?: string; page?: string }> }) {
  await requireNavAccess("clients");
  const { q = "", page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);
  const where = q ? { name: { contains: q, mode: "insensitive" as const } } : {};

  const [clients, total] = await Promise.all([
    prisma.client.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.client.count({ where }),
  ]);

  return (
    <>
      <div className="flex-between mb16">
        <form>
          <input className="searchbox" name="q" placeholder="Search clients..." defaultValue={q} />
        </form>
        <Link className="btn btn-primary" href="/clients/new">
          + Register Client
        </Link>
      </div>
      {total === 0 ? (
        <div className="card">
          <EmptyState
            title={q ? `No clients match "${q}"` : "No clients yet"}
            hint={q ? "Try a different search, or register a new client." : "Register your first client to be able to open a matter for them."}
            actionHref="/clients/new"
            actionLabel="+ Register Client"
          />
        </div>
      ) : (
        <>
      <div className="card" style={{ padding: 0 }}>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Role</th>
                <th>ID / Reg No.</th>
                <th>Phone</th>
                <th>Email</th>
                <th>KYC</th>
                <th>Conflict Check</th>
              </tr>
            </thead>
            <tbody>
              {clients.map((c) => (
                <tr key={c.id}>
                  <td>
                    <b>{c.name}</b>
                    <div className="small muted">Client since {fmtDate(c.createdAt)}</div>
                  </td>
                  <td>
                    <span className="badge badge-blue">{c.role}</span>
                  </td>
                  <td className="small">{c.idNumber || "—"}</td>
                  <td className="small">{c.phone || "—"}</td>
                  <td className="small">{c.email || "—"}</td>
                  <td>
                    <KycBadge kyc={c.kyc} />
                  </td>
                  <td>{c.conflict ? <span className="badge badge-red">Flagged</span> : <span className="badge badge-green">Clear</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <Pagination page={page} pageSize={PAGE_SIZE} total={total} basePath="/clients" extraParams={{ q }} />
        </>
      )}
    </>
  );
}
