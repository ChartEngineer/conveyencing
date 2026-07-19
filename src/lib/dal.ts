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

// Staff roles have firm-wide visibility by design (any matter, via the "matters" nav).
// CLIENT and COLLABORATOR are scoped to specific matters, so any action that takes a matterId
// from the client (e.g. sending a message) must check membership explicitly — nav access alone
// only confirms they're allowed on *a* matter page, not *this* matter.
export async function assertMatterAccess(matterId: string) {
  const user = await getCurrentUser();

  if (user.role === "CLIENT") {
    const client = await prisma.client.findUnique({ where: { portalUserId: user.id } });
    const linked = client && (await prisma.matterClient.findUnique({ where: { matterId_clientId: { matterId, clientId: client.id } } }));
    if (!linked) redirect("/portal");
    return user;
  }

  if (user.role === "COLLABORATOR") {
    const link = await prisma.matterCollaborator.findFirst({ where: { matterId, userId: user.id, status: "ACCEPTED" } });
    if (!link) redirect("/collab");
    return user;
  }

  return user;
}
