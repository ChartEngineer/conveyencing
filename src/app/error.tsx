"use client";

import { useEffect } from "react";

export default function RootError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(180deg, var(--navy), var(--navy-2))",
      }}
    >
      <div className="card" style={{ maxWidth: 420, textAlign: "center" }}>
        <h3>Something went wrong</h3>
        <div className="small muted mb16">
          Deeds360 hit an unexpected error — often a temporary network or database hiccup. Your data is safe; try
          again in a moment.
        </div>
        <button className="btn btn-primary" onClick={() => reset()}>
          Try again
        </button>
      </div>
    </div>
  );
}
