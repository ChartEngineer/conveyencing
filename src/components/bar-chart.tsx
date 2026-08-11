export default function BarChart({ data }: { data: { label: string; value: number }[] }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <div className="bar-chart" role="img" aria-label="Matter count by conveyancing stage">
      {data.map((d) => (
        <div key={d.label} className="bar-chart-column">
          <div className="bar-chart-value">
            {d.value || ""}
          </div>
          <div className="bar-chart-track">
            <div
              className="bar-chart-bar"
              style={{ minHeight: d.value > 0 ? 4 : 0, height: `${(d.value / max) * 100}%` }}
            />
          </div>
          <div className="bar-chart-label">
            {d.label}
          </div>
        </div>
      ))}
    </div>
  );
}
