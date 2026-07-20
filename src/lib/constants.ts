export const STAGES = [
  "Matter Opened",
  "Instruction Received",
  "Due Diligence",
  "Agreement of Sale",
  "Tax Clearance",
  "Rates Clearance",
  "Transfer Duty",
  "Deeds Office Submission",
  "Registration",
  "Title Deed Released",
  "Matter Closed",
] as const;

export const STAGE_META: Record<string, { days: number; role: string; docs: string[] }> = {
  "Matter Opened": { days: 1, role: "Conveyancing Secretary", docs: ["Client instruction form"] },
  "Instruction Received": { days: 2, role: "Legal Practitioner", docs: ["Signed mandate", "Copies of ID/passport"] },
  "Due Diligence": { days: 7, role: "Conveyancing Secretary", docs: ["Deeds Office search", "Title deed copy", "Survey diagram"] },
  "Agreement of Sale": { days: 5, role: "Legal Practitioner", docs: ["Signed Agreement of Sale"] },
  "Tax Clearance": { days: 10, role: "Accounts Officer", docs: ["ZIMRA tax clearance certificate"] },
  "Rates Clearance": { days: 10, role: "Conveyancing Secretary", docs: ["Local authority rates clearance"] },
  "Transfer Duty": { days: 5, role: "Accounts Officer", docs: ["Transfer duty receipt (ZIMRA)"] },
  "Deeds Office Submission": { days: 3, role: "Legal Practitioner", docs: ["Lodgement cover", "Draft deed of transfer"] },
  Registration: { days: 21, role: "Clerk", docs: ["Deeds Office registration confirmation"] },
  "Title Deed Released": { days: 5, role: "Conveyancing Secretary", docs: ["Original title deed"] },
  "Matter Closed": { days: 2, role: "Partner", docs: ["Final statement", "Client handover letter"] },
};

export type StaffRole =
  | "ADMINISTRATOR"
  | "PARTNER"
  | "LEGAL_PRACTITIONER"
  | "CONVEYANCING_SECRETARY"
  | "ACCOUNTS_OFFICER"
  | "CLERK"
  | "ESTATE_AGENT"
  | "BANK_REPRESENTATIVE"
  | "CLIENT"
  | "COLLABORATOR";

export const STAFF_ROLE_LABELS: Record<StaffRole, string> = {
  ADMINISTRATOR: "Administrator",
  PARTNER: "Partner",
  LEGAL_PRACTITIONER: "Legal Practitioner",
  CONVEYANCING_SECRETARY: "Conveyancing Secretary",
  ACCOUNTS_OFFICER: "Accounts Officer",
  CLERK: "Clerk",
  ESTATE_AGENT: "Estate Agent",
  BANK_REPRESENTATIVE: "Bank Representative",
  CLIENT: "Client",
  COLLABORATOR: "External Collaborator",
};

export type CollaboratorRole = "OPPOSING_COUNSEL" | "BANK" | "OTHER";

export const COLLABORATOR_ROLE_LABELS: Record<CollaboratorRole, string> = {
  OPPOSING_COUNSEL: "Opposing Counsel",
  BANK: "Bank",
  OTHER: "Other",
};

export type NavItem = {
  id: string;
  href: string;
  label: string;
  icon: string;
  roles: StaffRole[];
  // Minimum plan tier required, if any. Unset means available on every tier (Solo included).
  minTier?: "SOLO" | "PRACTICE" | "FIRM";
};

export const NAV: NavItem[] = [
  {
    id: "dashboard",
    href: "/dashboard",
    label: "Dashboard",
    icon: "▤",
    roles: ["ADMINISTRATOR", "PARTNER", "LEGAL_PRACTITIONER", "CONVEYANCING_SECRETARY", "ACCOUNTS_OFFICER", "CLERK", "ESTATE_AGENT", "BANK_REPRESENTATIVE"],
  },
  {
    id: "matters",
    href: "/matters",
    label: "Matters",
    icon: "\u{1F4C1}",
    roles: ["ADMINISTRATOR", "PARTNER", "LEGAL_PRACTITIONER", "CONVEYANCING_SECRETARY", "ACCOUNTS_OFFICER", "CLERK", "ESTATE_AGENT", "BANK_REPRESENTATIVE"],
  },
  {
    id: "clients",
    href: "/clients",
    label: "Clients (CRM)",
    icon: "\u{1F464}",
    roles: ["ADMINISTRATOR", "PARTNER", "LEGAL_PRACTITIONER", "CONVEYANCING_SECRETARY"],
  },
  {
    id: "properties",
    href: "/properties",
    label: "Properties",
    icon: "\u{1F3E0}",
    roles: ["ADMINISTRATOR", "PARTNER", "LEGAL_PRACTITIONER", "CONVEYANCING_SECRETARY", "ESTATE_AGENT"],
  },
  {
    id: "documents",
    href: "/documents",
    label: "Document Generator",
    icon: "\u{1F4C4}",
    roles: ["ADMINISTRATOR", "PARTNER", "LEGAL_PRACTITIONER", "CONVEYANCING_SECRETARY"],
  },
  {
    id: "tasks",
    href: "/tasks",
    label: "Tasks",
    icon: "✅",
    roles: ["ADMINISTRATOR", "PARTNER", "LEGAL_PRACTITIONER", "CONVEYANCING_SECRETARY", "ACCOUNTS_OFFICER", "CLERK"],
  },
  {
    id: "financials",
    href: "/financials",
    label: "Financials",
    icon: "\u{1F4B0}",
    roles: ["ADMINISTRATOR", "PARTNER", "ACCOUNTS_OFFICER"],
    minTier: "PRACTICE",
  },
  {
    id: "compliance",
    href: "/compliance",
    label: "Compliance",
    icon: "\u{1F512}",
    roles: ["ADMINISTRATOR", "PARTNER", "LEGAL_PRACTITIONER"],
    minTier: "PRACTICE",
  },
  {
    id: "ai",
    href: "/ai",
    label: "AI Assistant",
    icon: "✨",
    roles: ["ADMINISTRATOR", "PARTNER", "LEGAL_PRACTITIONER", "CONVEYANCING_SECRETARY"],
  },
  {
    id: "portal",
    href: "/portal",
    label: "Client Portal",
    icon: "\u{1F310}",
    roles: ["CLIENT"],
  },
  {
    id: "collab",
    href: "/collab",
    label: "Shared Matters",
    icon: "\u{1F91D}",
    roles: ["COLLABORATOR"],
  },
  {
    id: "users",
    href: "/users",
    label: "Staff Users",
    icon: "\u{1F511}",
    roles: ["ADMINISTRATOR"],
  },
  {
    id: "settings",
    href: "/settings",
    label: "Settings",
    icon: "\u{2699}",
    roles: ["ADMINISTRATOR"],
  },
];

export function navForRole(role: StaffRole): NavItem[] {
  return NAV.filter((n) => n.roles.includes(role));
}

const TIER_RANK: Record<"SOLO" | "PRACTICE" | "FIRM", number> = { SOLO: 0, PRACTICE: 1, FIRM: 2 };

// Nav visibility only — the actual page load is enforced separately by requireNavAccess (see
// src/lib/dal.ts), same "visibility vs authorization" split as role-based nav below.
export function navForRoleAndPlan(role: StaffRole, planTier: "SOLO" | "PRACTICE" | "FIRM"): NavItem[] {
  return navForRole(role).filter((n) => !n.minTier || TIER_RANK[planTier] >= TIER_RANK[n.minTier]);
}

export function fmtMoney(cents: number): string {
  return "US$" + (cents / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function fmtDate(d: Date | string | null | undefined): string {
  if (!d) return "—";
  const dt = typeof d === "string" ? new Date(d) : d;
  return dt.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

export function addDays(date: Date, n: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}
