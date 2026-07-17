"use client";

import { useTransition } from "react";

export default function StatusSelect<T extends string>({
  id,
  value,
  options,
  labels,
  onChange,
}: {
  id: string;
  value: T;
  options: T[];
  labels: Record<T, string>;
  onChange: (id: string, value: T) => Promise<void>;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <select
      disabled={pending}
      defaultValue={value}
      style={{ border: "1px solid var(--border)", borderRadius: 6, padding: "4px 6px", fontSize: 12 }}
      onChange={(e) => startTransition(() => onChange(id, e.target.value as T))}
    >
      {options.map((o) => (
        <option key={o} value={o}>
          {labels[o]}
        </option>
      ))}
    </select>
  );
}
