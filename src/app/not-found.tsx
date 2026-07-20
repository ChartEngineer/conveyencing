import Link from "next/link";
import { getSession } from "@/lib/session";

export default async function NotFound() {
  const session = await getSession();
  const homeHref = !session?.userId ? "/login" : session.role === "CLIENT" ? "/portal" : session.role === "COLLABORATOR" ? "/collab" : "/dashboard";

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
      <div className="card" style={{ width: "min(420px, 92vw)", textAlign: "center" }}>
        <div className="flex gap8 mb20" style={{ alignItems: "center", justifyContent: "center" }}>
          <div className="brand-mark" style={{ background: "var(--gold)", color: "var(--navy)" }}>
            D
          </div>
          <div style={{ textAlign: "left" }}>
            <div style={{ fontFamily: "Georgia, serif", fontWeight: 700, fontSize: 18, color: "var(--navy)" }}>Deeds360</div>
            <div className="small muted">Conveyancing &amp; Legal Practice Suite</div>
          </div>
        </div>
        <h3>Page not found</h3>
        <div className="small muted mb16">
          The page you&apos;re looking for doesn&apos;t exist, or you don&apos;t have access to it.
        </div>
        <Link className="btn btn-primary" href={homeHref}>
          Back to Deeds360
        </Link>
      </div>
    </div>
  );
}
