import Link from "next/link";

export default function Pagination({ page, pageSize, total, basePath, extraParams = {} }: { page: number; pageSize: number; total: number; basePath: string; extraParams?: Record<string, string> }) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  if (totalPages <= 1) return null;

  const hrefFor = (p: number) => {
    const params = new URLSearchParams({ ...extraParams, page: String(p) });
    return `${basePath}?${params.toString()}`;
  };

  return (
    <div className="flex-between mt16">
      <div className="small muted">
        Page {page} of {totalPages} ({total} total)
      </div>
      <div className="flex gap8">
        {page > 1 && (
          <Link className="pill-btn" href={hrefFor(page - 1)}>
            ← Previous
          </Link>
        )}
        {page < totalPages && (
          <Link className="pill-btn" href={hrefFor(page + 1)}>
            Next →
          </Link>
        )}
      </div>
    </div>
  );
}
