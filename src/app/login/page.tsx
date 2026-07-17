import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import LoginForm from "./login-form";

export default async function LoginPage() {
  const session = await getSession();
  if (session?.userId) {
    redirect(session.role === "CLIENT" ? "/portal" : "/dashboard");
  }

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
      <div className="card" style={{ width: 380 }}>
        <div className="flex gap8 mb20" style={{ alignItems: "center" }}>
          <div className="brand-mark" style={{ background: "var(--gold)", color: "var(--navy)" }}>
            D
          </div>
          <div>
            <div style={{ fontFamily: "Georgia, serif", fontWeight: 700, fontSize: 18, color: "var(--navy)" }}>
              Deeds360
            </div>
            <div className="small muted">Conveyancing &amp; Legal Practice Suite</div>
          </div>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
