import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/db";
import LoginForm from "./login-form";

export default async function LoginPage() {
  const session = await getSession();
  if (session?.userId) {
    if (session.role === "CLIENT") redirect("/portal");
    if (session.role === "COLLABORATOR") redirect("/collab");
    redirect("/dashboard");
  }
  const userCount = await prisma.user.count();
  if (userCount === 0) {
    redirect("/setup");
  }

  return (
    <div className="login-scene">
      <div className="login-scene-texture" aria-hidden="true" />
      <div className="login-scene-inner">
        <div className="login-mark">
          <span className="login-mark-glyph">D</span>
          <div className="login-mark-text">
            <div className="login-mark-title">Deeds360</div>
            <div className="login-mark-kicker">Conveyancing &amp; Legal Practice Suite</div>
          </div>
        </div>
        <p className="login-tagline">
          From opening a matter to lodging the deed — one record of title, from instruction to registration.
        </p>
        <div className="card login-card">
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
