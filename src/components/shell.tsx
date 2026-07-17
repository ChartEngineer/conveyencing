"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { NavItem, StaffRole } from "@/lib/constants";
import { STAFF_ROLE_LABELS } from "@/lib/constants";
import { logout } from "@/app/actions/auth";

const PAGE_META: Record<string, { title: string; subtitle: string }> = {
  dashboard: { title: "Dashboard", subtitle: "Firm-wide overview of active conveyancing matters" },
  matters: { title: "Matters", subtitle: "Track every matter through the full transfer workflow" },
  clients: { title: "Clients (CRM)", subtitle: "Buyers, sellers and related parties" },
  properties: { title: "Property Register", subtitle: "Registered stands and title information" },
  documents: { title: "Document Generator", subtitle: "Auto-generate conveyancing documents from matter data" },
  tasks: { title: "Tasks", subtitle: "Work assigned across the practice" },
  financials: { title: "Financials", subtitle: "Fees, disbursements, trust account & invoicing" },
  compliance: { title: "Compliance", subtitle: "KYC, AML, clearances and audit trail" },
  ai: { title: "AI Legal Assistant", subtitle: "Demo assistant — always reviewed by a legal practitioner" },
  portal: { title: "Client Portal", subtitle: "Track your property transfer in real time" },
  users: { title: "Staff Users", subtitle: "Manage staff accounts and access" },
};

export default function Shell({
  nav,
  user,
  children,
}: {
  nav: NavItem[];
  user: { name: string; role: StaffRole };
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const activeId = nav.find((n) => pathname.startsWith(n.href))?.id ?? "";
  const meta = PAGE_META[activeId] ?? { title: "Deeds360", subtitle: "" };
  const initials = user.name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("");

  return (
    <div id="app">
      <div className="sidebar no-print">
        <div className="brand">
          <div className="brand-mark">D</div>
          <div className="brand-text">
            <div className="t1">Deeds360</div>
            <div className="t2">Conveyancing Suite</div>
          </div>
        </div>
        <div className="nav">
          <div className="nav-section">Practice</div>
          {nav.map((n) => (
            <Link key={n.id} href={n.href} className={`nav-item ${activeId === n.id ? "active" : ""}`}>
              <span className="ic">{n.icon}</span>
              <span>{n.label}</span>
            </Link>
          ))}
        </div>
        <div className="sidebar-foot">
          Deeds360 — Zimbabwe conveyancing workflow
          <form action={logout} className="mt8">
            <button type="submit" style={{ background: "none", border: "none", color: "#c9d6e8", textDecoration: "underline", padding: 0, fontSize: "11.5px" }}>
              Sign out
            </button>
          </form>
        </div>
      </div>
      <div className="main">
        <div className="topbar no-print">
          <div>
            <h1>{meta.title}</h1>
            <div className="sub">{meta.subtitle}</div>
          </div>
          <div className="top-right">
            <div className="small muted">{STAFF_ROLE_LABELS[user.role]}</div>
            <div className="avatar">{initials || "U"}</div>
          </div>
        </div>
        <div className="content">{children}</div>
      </div>
    </div>
  );
}
