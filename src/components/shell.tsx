"use client";

import { useState } from "react";
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
  collab: { title: "Shared Matters", subtitle: "Matters you've been given access to collaborate on" },
  settings: { title: "Settings", subtitle: "Demo data, plan, and integrations" },
};

export default function Shell({
  nav,
  user,
  demoActive,
  children,
}: {
  nav: NavItem[];
  user: { name: string; role: StaffRole };
  demoActive?: boolean;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const activeId = nav.find((n) => pathname.startsWith(n.href))?.id ?? "";
  const meta = PAGE_META[activeId] ?? { title: "Deeds360", subtitle: "" };
  const initials = user.name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("");

  return (
    <div id="app">
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      {menuOpen && <div className="sidebar-overlay no-print" onClick={() => setMenuOpen(false)} />}
      <aside className={`sidebar no-print ${menuOpen ? "open" : ""}`} aria-label="Primary navigation">
        <div className="brand">
          <div className="brand-mark">D</div>
          <div className="brand-text">
            <div className="t1">Deeds360</div>
            <div className="t2">Conveyancing Suite</div>
          </div>
        </div>
        <nav className="nav" aria-label="Practice">
          <div className="nav-section">Practice</div>
          {nav.map((n) => (
            <Link
              key={n.id}
              href={n.href}
              className={`nav-item ${activeId === n.id ? "active" : ""}`}
              aria-current={activeId === n.id ? "page" : undefined}
              onClick={() => setMenuOpen(false)}
            >
              <span className="ic">{n.icon}</span>
              <span>{n.label}</span>
            </Link>
          ))}
        </nav>
        <footer className="sidebar-foot">
          Deeds360 — Zimbabwe conveyancing workflow
          <form action={logout} className="sign-out-form">
            <button className="sign-out-button" type="submit">
              Sign out
            </button>
          </form>
        </footer>
      </aside>
      <section className="main">
        <header className="topbar no-print">
          <div className="flex gap8" style={{ alignItems: "center" }}>
            <button className="menu-toggle no-print" type="button" aria-label="Open menu" onClick={() => setMenuOpen(true)}>
              <span className="menu-toggle-bars" aria-hidden="true">
                <span />
                <span />
                <span />
              </span>
            </button>
            <div>
              <h1>{meta.title}</h1>
              <div className="sub">{meta.subtitle}</div>
            </div>
          </div>
          <div className="top-right">
            <div className="small muted">{STAFF_ROLE_LABELS[user.role]}</div>
            <div className="avatar">{initials || "U"}</div>
          </div>
        </header>
        <main id="main-content" className="content">
          {demoActive && (
            <div className="demo-banner">
              Demo data is active — visible to everyone. An administrator can clear it from Settings before real use.
            </div>
          )}
          {children}
        </main>
      </section>
    </div>
  );
}
