export default function Loading() {
  return (
    <>
      <div className="skel" style={{ height: 26, width: 220, marginBottom: 20 }} />
      <div className="grid grid-4 mb16">
        {[0, 1, 2, 3].map((i) => (
          <div className="card stat-card" key={i}>
            <div className="skel" style={{ height: 11, width: "60%", marginBottom: 10 }} />
            <div className="skel" style={{ height: 24, width: "40%" }} />
          </div>
        ))}
      </div>
      <div className="card">
        <div className="skel" style={{ height: 14, width: 140, marginBottom: 16 }} />
        {[0, 1, 2, 3, 4].map((i) => (
          <div className="skel" key={i} style={{ height: 14, width: "100%", marginBottom: 10 }} />
        ))}
      </div>
    </>
  );
}
