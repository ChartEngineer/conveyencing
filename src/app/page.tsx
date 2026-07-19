import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/db";

export default async function Home() {
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
  redirect("/login");
}
