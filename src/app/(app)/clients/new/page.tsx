import Link from "next/link";
import { requireNavAccess } from "@/lib/dal";
import NewClientForm from "./new-client-form";

export default async function NewClientPage() {
  await requireNavAccess("clients");

  return (
    <div className="card" style={{ maxWidth: 560 }}>
      <div className="flex-between mb16">
        <h3 style={{ margin: 0 }}>Register New Client</h3>
        <Link href="/clients" className="small muted">
          Cancel
        </Link>
      </div>
      <NewClientForm />
    </div>
  );
}
