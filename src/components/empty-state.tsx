import Link from "next/link";

export default function EmptyState({
  title,
  hint,
  actionHref,
  actionLabel,
}: {
  title: string;
  hint?: string;
  actionHref?: string;
  actionLabel?: string;
}) {
  return (
    <div className="empty">
      <div>{title}</div>
      {hint && <div className="small muted mt8">{hint}</div>}
      {actionHref && actionLabel && (
        <Link href={actionHref} className="btn btn-primary btn-sm mt16">
          {actionLabel}
        </Link>
      )}
    </div>
  );
}
