import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/db";

export default async function Home() {
  const session = await getSession();
  if (session?.userId) {
    redirect(session.role === "CLIENT" ? "/portal" : "/dashboard");
  }
  const userCount = await prisma.user.count();
  if (userCount === 0) {
    redirect("/setup");
  }
  redirect("/login");
}
