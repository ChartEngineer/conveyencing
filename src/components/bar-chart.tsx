export default function BarChart({ data }: { data: { label: string; value: number }[] }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <div className="flex" style={{ alignItems: "flex-end", gap: 6, height: 150 }}>
      {data.map((d) => (
        <div key={d.label} className="flex" style={{ flexDirection: "column", alignItems: "center", flex: 1, height: "100%", justifyContent: "flex-end" }}>
          <div className="small muted" style={{ marginBottom: 4 }}>
            {d.value || ""}
          </div>
          <div
            style={{
              width: "70%",
              minHeight: d.value > 0 ? 4 : 0,
              height: `${(d.value / max) * 100}%`,
              background: "linear-gradient(180deg, var(--gold), var(--gold-dark))",
              borderRadius: "4px 4px 0 0",
            }}
          />
          <div className="small muted" style={{ marginTop: 6, fontSize: 9, textAlign: "center", lineHeight: 1.2 }}>
            {d.label}
          </div>
        </div>
      ))}
    </div>
  );
}
