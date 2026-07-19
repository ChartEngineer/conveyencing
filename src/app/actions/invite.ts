"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { createSession } from "@/lib/session";

export type AcceptInviteState = { error?: string } | undefined;

export async function acceptInvite(token: string, _prevState: AcceptInviteState, formData: FormData): Promise<AcceptInviteState> {
  const invite = await prisma.matterCollaborator.findUnique({ where: { inviteToken: token } });

  if (!invite || invite.status === "REVOKED" || invite.inviteTokenExpiresAt < new Date()) {
    return { error: "This invite link is no longer valid. Ask the firm to send a new one." };
  }

  const existingUser = await prisma.user.findUnique({ where: { email: invite.email } });

  let userId: string;
  if (existingUser) {
    // Same person already has a collaborator account from a prior invite — just link this
    // matter's invite to it, no new password needed.
    if (existingUser.role !== "COLLABORATOR") {
      return { error: "This email is already registered to a different kind of account. Contact the firm." };
    }
    userId = existingUser.id;
  } else {
    const password = String(formData.get("password") || "");
    if (!password || password.length < 8) {
      return { error: "Please choose a password of at least 8 characters." };
    }
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { name: invite.name, email: invite.email, role: "COLLABORATOR", passwordHash },
    });
    userId = user.id;
  }

  await prisma.matterCollaborator.update({
    where: { id: invite.id },
    data: { status: "ACCEPTED", userId },
  });

  await createSession({ userId, role: "COLLABORATOR", name: invite.name });
  redirect("/collab");
}
