import type { StaffRole } from "@/lib/constants";

// Roles that may see financial figures (price, invoices, trust ledger) and full client PII
// (ID numbers, phone, email, address). Everyone else — Clerk, Estate Agent, Bank Representative —
// gets matter status/stage/property/party-name visibility only, per real conveyancing practice:
// external parties and logistics staff don't need to see client identity documents or firm financials.
const SENSITIVE_DATA_ROLES: StaffRole[] = ["ADMINISTRATOR", "PARTNER", "LEGAL_PRACTITIONER", "CONVEYANCING_SECRETARY", "ACCOUNTS_OFFICER"];

export function canViewSensitiveData(role: StaffRole): boolean {
  return SENSITIVE_DATA_ROLES.includes(role);
}
