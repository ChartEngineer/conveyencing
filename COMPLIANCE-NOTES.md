# Compliance Notes

Running list of places in the codebase that touch trust accounts, client funds, or personal
data — for review against Zimbabwe's regulatory and data-protection requirements (or wherever
Deeds360 is ultimately deployed). Nothing here is a legal opinion; it's a map of where to look.

## Trust accounts / client funds

- **`TrustTransaction` model** (`prisma/schema.prisma`) and its immutability triggers
  (`prisma/migrations/20260717140000_add_immutability_triggers/migration.sql`) — trust ledger
  entries can never be updated or deleted at the database level, even by a superuser/service-role
  connection. Corrections must be new offsetting entries. Confirm this matches the record-keeping
  rules your law society/regulator requires for trust accounts.
- **`src/app/actions/trust.ts`** (`recordTrustTransaction`) — the only write path into the trust
  ledger; has a negative-balance guard. Any future trust-related feature should go through this
  pattern, not a raw `prisma.trustTransaction.create`.
- **`Subscription` model / `src/app/actions/billing.ts`** — billing status and plan tier are
  stored, but **no payment credentials, card numbers, or bank details are stored anywhere in this
  codebase**. Plan changes are a manual admin action (see the `// TODO: connect a local payment
  provider` comment in `billing.ts`) representing an out-of-band payment arrangement, not an
  in-app transaction. If a real payment provider (Paynow, EcoCash, a card processor) is connected
  later, that integration needs its own review — PCI/data-handling obligations, where card data
  transits, etc.

## Personal data (client / party PII)

- **`Client` model** — `idNumber`, `phone`, `email`, `address` are stored as plain text fields, no
  encryption at rest beyond whatever Postgres/Supabase provides at the infrastructure level.
  Confirm this meets applicable data-protection requirements (e.g. Zimbabwe's Data Protection Act)
  for how long this data is retained and who can access it.
- **`canViewSensitiveData()`** (`src/lib/permissions.ts`) — the access-control boundary for who
  sees PII/financials (price, trust ledger, client ID numbers). Currently role-based only; if
  jurisdiction requires per-record consent or purpose limitation, that's not modeled here yet.
- **`MatterCollaborator`** (`prisma/schema.prisma`, `src/app/actions/collaborators.ts`) — external
  parties (opposing counsel, banks) are invited by name + email and, once accepted, can see a
  matter's parties (names only, not ID numbers), stage, and document checklist. Confirm the firm
  has a basis for sharing that much with an external party before an invite is sent — the app
  doesn't gate this beyond the inviting staff member's own judgment.
- **Audit log (`AuditLogEntry`)** — also immutable (same trigger pattern as trust transactions).
  Append-only by design, which is good for non-repudiation but means it can only grow — confirm
  there's no regulatory requirement to purge personal data from audit trails after some retention
  period, since the current design has no deletion path for it.

## Not yet reviewed

- File uploads (`MatterFile` — deed scans, IDs, etc., stored as bytes directly in Postgres) —
  same at-rest question as Client PII above, plus: no virus scanning, no file-type-based access
  restriction beyond who can reach the matter.
- No data export / "right to be forgotten" flow exists for clients or collaborators — the seed-
  data wipe scripts (`scripts/wipe-seed-data.js` and friends) are for demo/test data only, not a
  real subject-access-request mechanism.
