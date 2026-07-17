import Link from "next/link";
import { prisma } from "@/lib/db";
import { fmtMoney } from "@/lib/constants";
import { requireNavAccess } from "@/lib/dal";

export default async function PropertiesPage() {
  await requireNavAccess("properties");

  const properties = await prisma.property.findMany({
    include: { owners: { orderBy: { fromYear: "asc" } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <>
      <div className="flex-between mb16">
        <div className="small muted">{properties.length} properties registered</div>
        <Link className="btn btn-primary" href="/properties/new">
          + Register Property
        </Link>
      </div>
      <div className="grid grid-3">
        {properties.map((p) => (
          <div className="card" key={p.id}>
            <div className="flex-between mb8">
              <h3 style={{ margin: 0, fontSize: 15 }}>{p.standNo}</h3>
            </div>
            <div className="small muted mb12">
              {p.suburb}, {p.city}
            </div>
            <div className="small mb8">
              <b>Title Deed:</b> {p.titleDeedNo}
            </div>
            <div className="small mb8">
              <b>Survey Diagram:</b> {p.surveyDiagram}
            </div>
            <div className="small mb8">
              <b>Size:</b> {p.size}
            </div>
            <div className="small mb8">
              <b>Valuation:</b> {fmtMoney(p.valuationCents)}
            </div>
            <div className="small mb8">
              <b>GPS:</b> {p.gps}
            </div>
            <div className="small mb8">
              <b>Current Owner:</b> {p.owners[p.owners.length - 1]?.ownerName ?? "—"}
            </div>
            <div className="small muted mt8" style={{ borderTop: "1px solid var(--border)", paddingTop: 8 }}>
              Ownership history: {p.owners.map((o) => `${o.ownerName} (${o.fromYear}${o.toYear ? "–" + o.toYear : "–present"})`).join(" → ")}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
