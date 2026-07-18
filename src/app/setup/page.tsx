import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import SetupForm from "./setup-form";

// Must re-check the user count on every request, not just once at build time —
// otherwise a build-time snapshot gets baked in as a static redirect.
export const dynamic = "force-dynamic";

export default async function SetupPage() {
  const userCount = await prisma.user.count();
  if (userCount > 0) {
    redirect("/login");
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
      <div className="card" style={{ width: 420 }}>
        <div className="flex gap8 mb20" style={{ alignItems: "center" }}>
          <div className="brand-mark" style={{ background: "var(--gold)", color: "var(--navy)" }}>
            D
          </div>
          <div>
            <div style={{ fontFamily: "Georgia, serif", fontWeight: 700, fontSize: 18, color: "var(--navy)" }}>
              Deeds360
            </div>
            <div className="small muted">First-run setup — create the Administrator account</div>
          </div>
        </div>
        <SetupForm />
      </div>
    </div>
  );
}
