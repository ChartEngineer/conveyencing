import { prisma } from "@/lib/db";
import { requireNavAccess } from "@/lib/dal";
import { getSubscription } from "@/lib/entitlements";
import { PLANS, TIER_ORDER } from "@/lib/plans";
import { seedDemoData, clearDemoData } from "@/app/actions/demo";
import { setPlanTier } from "@/app/actions/billing";

const INTEGRATIONS = [
  { name: "Deeds Office / Registrar lookups", minTier: "FIRM" as const },
  { name: "Bank / mortgage workflows", minTier: "FIRM" as const },
  { name: "Estate-agent referral network", minTier: "FIRM" as const },
  { name: "White-label client portal", minTier: "FIRM" as const },
];

export default async function SettingsPage() {
  await requireNavAccess("settings");

  const [demoMatterCount, subscription, staffCount] = await Promise.all([
    prisma.matter.count({ where: { isDemo: true } }),
    getSubscription(),
    prisma.user.count({ where: { role: { notIn: ["CLIENT", "COLLABORATOR"] } } }),
  ]);
  const isDemoActive = demoMatterCount > 0;
  const plan = PLANS[subscription.tier];

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

      <div className="card">
        <h3>Usage This Period</h3>
        <div className="small muted mb8">Seats</div>
        <div className="progress-bar mb8">
          <div style={{ width: `${Math.min(100, Math.round((staffCount / subscription.seats) * 100))}%` }} />
        </div>
        <div className="small mb16">
          {staffCount} staff account(s) · {subscription.seats} seat(s) included
          {staffCount > subscription.seats && <span style={{ color: "var(--red)" }}> — over included seats</span>}
        </div>

        <div className="small muted mb8">AI Assistant credits</div>
        <div className="progress-bar mb8">
          <div
            style={{ width: `${Math.min(100, Math.round((subscription.aiCreditsUsed / subscription.aiCreditsLimit) * 100))}%` }}
          />
        </div>
        <div className="small mb16">
          {subscription.aiCreditsUsed} / {subscription.aiCreditsLimit} used
        </div>

        <div className="small muted mb8">Document generation credits</div>
        <div className="progress-bar mb8">
          <div
            style={{
              width: `${Math.min(100, Math.round((subscription.docCreditsUsed / subscription.docCreditsLimit) * 100))}%`,
            }}
          />
        </div>
        <div className="small">
          {subscription.docCreditsUsed} / {subscription.docCreditsLimit} used
        </div>
      </div>

      <div className="card" style={{ gridColumn: "1 / -1" }}>
        <div className="flex-between mb16">
          <h3 style={{ margin: 0 }}>Plan &amp; Billing</h3>
          <span className="badge badge-blue">
            Current: {plan.name} ({subscription.status})
          </span>
        </div>
        <div className="grid grid-3 mb16">
          {TIER_ORDER.map((tier) => {
            const p = PLANS[tier];
            const isCurrent = tier === subscription.tier;
            return (
              <div
                key={tier}
                className="card"
                style={{ border: isCurrent ? "2px solid var(--gold)" : undefined, boxShadow: "none" }}
              >
                <div className="flex-between mb8">
                  <b>{p.name}</b>
                  {isCurrent && <span className="badge badge-gold">Current</span>}
                </div>
                <div className="small muted mb8">{p.seatRange}</div>
                <div style={{ fontFamily: "Georgia, serif", fontWeight: 700, fontSize: 22, color: "var(--navy)" }} className="mb12">
                  {p.priceUsdPerSeat != null ? `US$${p.priceUsdPerSeat}/seat/mo` : "Contact us"}
                </div>
                <ul className="klist mb16">
                  {p.features.map((f) => (
                    <li key={f}>
                      <span>✓</span> {f}
                    </li>
                  ))}
                </ul>
                {!isCurrent && (
                  <form action={setPlanTier}>
                    <input type="hidden" name="tier" value={tier} />
                    <button className="btn btn-ghost btn-sm" type="submit" style={{ width: "100%", justifyContent: "center" }}>
                      Switch to {p.name}
                    </button>
                  </form>
                )}
              </div>
            );
          })}
        </div>
        <div className="hint">
          Plan changes here are applied manually by an administrator after an out-of-band arrangement (bank
          transfer, invoice, etc.) — no payment is processed or stored by Deeds360 itself.
        </div>
      </div>

      <div className="card" style={{ gridColumn: "1 / -1" }}>
        <h3>Integrations &amp; Upsells</h3>
        <div className="small muted mb16">Not yet built — shown here to plan the roadmap.</div>
        {INTEGRATIONS.map((i) => (
          <div key={i.name} className="flex-between mb12" style={{ borderBottom: "1px dashed var(--border)", paddingBottom: 10 }}>
            <span className="small">{i.name}</span>
            <div className="flex gap8" style={{ alignItems: "center" }}>
              <span className="badge badge-gold">{PLANS[i.minTier].name}+</span>
              <span className="badge badge-gray">Coming soon</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
