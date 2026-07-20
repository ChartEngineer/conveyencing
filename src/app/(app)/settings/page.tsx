import { prisma } from "@/lib/db";
import { requireNavAccess } from "@/lib/dal";
import { seedDemoData, clearDemoData } from "@/app/actions/demo";

export default async function SettingsPage() {
  await requireNavAccess("settings");

  const demoMatterCount = await prisma.matter.count({ where: { isDemo: true } });
  const isDemoActive = demoMatterCount > 0;

  return (
    <div className="grid grid-2">
      <div className="card">
        <h3>Demo Data</h3>
        <div className="small muted mb16">
          Seed a realistic sample matter — two clients, a property, tasks, and an invoice — to demo Deeds360 to a
          prospective firm without touching your real records. Clear it any time; it never mixes with real data.
        </div>
        <div className="flex-between mb16">
          <span className="small">Status</span>
          {isDemoActive ? <span className="badge badge-amber">Active</span> : <span className="badge badge-gray">Off</span>}
        </div>
        <div className="flex gap8">
          <form action={seedDemoData}>
            <button className="btn btn-primary btn-sm" type="submit" disabled={isDemoActive}>
              Seed Demo Data
            </button>
          </form>
          <form action={clearDemoData}>
            <button className="btn btn-danger btn-sm" type="submit" disabled={!isDemoActive}>
              Clear Demo Data
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
