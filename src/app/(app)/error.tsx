"use client";

import { useEffect } from "react";

export default function AppError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="card" style={{ maxWidth: 480, margin: "60px auto", textAlign: "center" }}>
      <h3>Something went wrong</h3>
      <div className="small muted mb16">
        This page hit an unexpected error — often a temporary network or database hiccup. Your data is safe; try
        again in a moment.
      </div>
      <button className="btn btn-primary" onClick={() => reset()}>
        Try again
      </button>
    </div>
  );
}
