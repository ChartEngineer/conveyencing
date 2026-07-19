"use server";

import crypto from "crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/dal";
import { canViewSensitiveData } from "@/lib/permissions";
import { logAudit } from "@/lib/audit";
import type { CollaboratorRole } from "@/lib/constants";

const INVITE_EXPIRY_DAYS = 7;

export async function inviteCollaborator(matterId: string, formData: FormData) {
  const currentUser = await getCurrentUser();
  if (!canViewSensitiveData(currentUser.role)) {
    throw new Error("You don't have permission to invite collaborators to this matter.");
  }

  const name = String(formData.get("name") || "").trim();
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const role = String(formData.get("role") || "OTHER") as CollaboratorRole;

  if (!name || !email) {
    throw new Error("Name and email are required.");
  }

  const inviteToken = crypto.randomBytes(24).toString("hex");
  const inviteTokenExpiresAt = new Date(Date.now() + INVITE_EXPIRY_DAYS * 24 * 60 * 60 * 1000);

  const collaborator = await prisma.matterCollaborator.upsert({
    where: { matterId_email: { matterId, email } },
    // Re-inviting after a revoke (or before first acceptance) just refreshes the token/expiry —
    // it does not touch a userId already linked from a prior acceptance.
    update: { name, role, status: "PENDING", inviteToken, inviteTokenExpiresAt },
    create: { matterId, name, email, role, invitedById: currentUser.id, inviteToken, inviteTokenExpiresAt },
  });

  await logAudit(currentUser.id, `Invited collaborator ${name} (${email}) to matter`);

  revalidatePath(`/matters/${matterId}`);
  redirect(`/matters/${matterId}?invited=${collaborator.id}`);
}

export async function revokeCollaborator(collaboratorId: string, matterId: string) {
  const currentUser = await getCurrentUser();
  if (!canViewSensitiveData(currentUser.role)) {
    throw new Error("You don't have permission to revoke collaborator access.");
  }

  await prisma.matterCollaborator.update({ where: { id: collaboratorId }, data: { status: "REVOKED" } });
  await logAudit(currentUser.id, `Revoked collaborator access (${collaboratorId})`);

  revalidatePath(`/matters/${matterId}`);
}
