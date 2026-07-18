import Link from "next/link";
import { prisma } from "@/lib/db";
import { createMatter } from "@/app/actions/matters";
import { requireNavAccess } from "@/lib/dal";
import EmptyState from "@/components/empty-state";

export default async function NewMatterPage() {
  await requireNavAccess("matters");

  const [clients, properties, staff] = await Promise.all([
    prisma.client.findMany({ orderBy: { name: "asc" } }),
    prisma.property.findMany({ orderBy: { standNo: "asc" } }),
    prisma.user.findMany({ where: { role: { not: "CLIENT" } }, orderBy: { name: "asc" } }),
  ]);

  if (clients.length === 0 || properties.length === 0) {
    return (
      <div className="card" style={{ maxWidth: 640 }}>
        <div className="flex-between mb16">
          <h3 style={{ margin: 0 }}>New Matter</h3>
          <Link href="/matters" className="small muted">
            Cancel
          </Link>
        </div>
        <EmptyState
          title="You need at least one client and one property before opening a matter"
          hint={
            clients.length === 0 && properties.length === 0
              ? "Register a client and a property first, then come back here."
              : clients.length === 0
                ? "Register a client first, then come back here."
                : "Register a property first, then come back here."
          }
          actionHref={clients.length === 0 ? "/clients/new" : "/properties/new"}
          actionLabel={clients.length === 0 ? "Register Client" : "Register Property"}
        />
      </div>
    );
  }

  return (
    <div className="card" style={{ maxWidth: 640 }}>
      <div className="flex-between mb16">
        <h3 style={{ margin: 0 }}>New Matter</h3>
        <Link href="/matters" className="small muted">
          Cancel
        </Link>
      </div>
      <form action={createMatter}>
        <div className="field">
          <label htmlFor="type">Matter Type</label>
          <select id="type" name="type" defaultValue="SALE">
            <option value="SALE">Sale</option>
            <option value="PURCHASE">Purchase</option>
            <option value="BOND_REGISTRATION">Bond Registration</option>
          </select>
        </div>
        <div className="field">
          <label htmlFor="clientIds">Parties (select buyer &amp; seller)</label>
          <select id="clientIds" name="clientIds" multiple size={6} required>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.role})
              </option>
            ))}
          </select>
          <div className="hint">Hold Ctrl/Cmd to select multiple parties.</div>
        </div>
        <div className="field">
          <label htmlFor="propertyId">Property</label>
          <select id="propertyId" name="propertyId" required>
            {properties.map((p) => (
              <option key={p.id} value={p.id}>
                {p.standNo} — {p.suburb}
              </option>
            ))}
          </select>
        </div>
        <div className="field-row">
          <div className="field">
            <label htmlFor="price">Agreed Price (US$)</label>
            <input id="price" name="price" type="number" defaultValue={100000} required />
          </div>
          <div className="field">
            <label htmlFor="priority">Priority</label>
            <select id="priority" name="priority" defaultValue="MEDIUM">
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>
          </div>
        </div>
        <div className="field">
          <label htmlFor="responsibleId">Responsible Legal Practitioner</label>
          <select id="responsibleId" name="responsibleId" required>
            {staff.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
        <button className="btn btn-primary" type="submit">
          Create Matter
        </button>
      </form>
    </div>
  );
}
