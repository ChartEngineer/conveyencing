export function StageBadge({ idx }: { idx: number }) {
  if (idx >= 10) return <span className="badge badge-green">Closed</span>;
  if (idx <= 1) return <span className="badge badge-blue">Early Stage</span>;
  if (idx <= 6) return <span className="badge badge-amber">In Progress</span>;
  return <span className="badge badge-gold">Near Completion</span>;
}

export function PriorityBadge({ priority }: { priority: "HIGH" | "MEDIUM" | "LOW" }) {
  const map = { HIGH: "badge-red", MEDIUM: "badge-amber", LOW: "badge-green" } as const;
  const label = { HIGH: "High", MEDIUM: "Medium", LOW: "Low" } as const;
  return <span className={`badge ${map[priority]}`}>{label[priority]}</span>;
}

export function KycBadge({ kyc }: { kyc: "VERIFIED" | "PENDING" | "NOT_STARTED" }) {
  const map = { VERIFIED: "badge-green", PENDING: "badge-amber", NOT_STARTED: "badge-gray" } as const;
  const label = { VERIFIED: "Verified", PENDING: "Pending", NOT_STARTED: "Not Started" } as const;
  return <span className={`badge ${map[kyc]}`}>{label[kyc]}</span>;
}

export function InvoiceStatusBadge({ status }: { status: "OUTSTANDING" | "PAID" | "OVERDUE" }) {
  const map = { PAID: "badge-green", OUTSTANDING: "badge-amber", OVERDUE: "badge-red" } as const;
  const label = { PAID: "Paid", OUTSTANDING: "Outstanding", OVERDUE: "Overdue" } as const;
  return <span className={`badge ${map[status]}`}>{label[status]}</span>;
}

export function TaskStatusBadge({ status }: { status: "OPEN" | "IN_PROGRESS" | "DONE" }) {
  const map = { OPEN: "badge-blue", IN_PROGRESS: "badge-amber", DONE: "badge-green" } as const;
  const label = { OPEN: "Open", IN_PROGRESS: "In Progress", DONE: "Done" } as const;
  return <span className={`badge ${map[status]}`}>{label[status]}</span>;
}
