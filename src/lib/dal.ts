import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/db";
import { NAV, navForRole } from "@/lib/constants";

export const verifySession = cache(async () => {
  const session = await getSession();
  if (!session?.userId) {
    redirect("/login");
  }
  return session;
});

export const getCurrentUser = cache(async () => {
  const session = await verifySession();
  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { id: true, name: true, email: true, role: true },
  });
  if (!user) {
    redirect("/login");
  }
  return user;
});

// Server-side route guard. NAV's `roles` array only controls sidebar visibility — it does not
// stop someone from typing the URL directly, so every page that appears in NAV must call this
// with its own nav id. Falls back to the user's own first available page rather than a hardcoded
// route, so a denied CLIENT (whose only page is /portal) can't be bounced into a redirect loop.
export async function requireNavAccess(navId: string) {
  const user = await getCurrentUser();
  const item = NAV.find((n) => n.id === navId);
  const allowed = item?.roles.includes(user.role);
  if (!allowed) {
    const fallback = navForRole(user.role)[0];
    redirect(fallback ? fallback.href : "/login");
  }
  return user;
}
