"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { verifySession } from "@/lib/dal";
import { logAudit } from "@/lib/audit";

export type CreateClientState = { error?: string } | undefined;

export async function createClient(_prevState: CreateClientState, formData: FormData): Promise<CreateClientState> {
  const session = await verifySession();

  const name = String(formData.get("name") || "").trim();
  if (!name) return { error: "Please enter a name." };

  const wantsPortal = formData.get("createPortalLogin") === "on";
  const portalEmail = String(formData.get("portalEmail") || "").trim().toLowerCase();
  const portalPassword = String(formData.get("portalPassword") || "");

  if (wantsPortal) {
    if (!portalEmail || portalPassword.length < 8) {
      return { error: "Portal login requires an email and a password of at least 8 characters." };
    }
    const existingUser = await prisma.user.findUnique({ where: { email: portalEmail } });
    if (existingUser) {
      return { error: "A portal account with that email already exists." };
    }
  }

  const existing = await prisma.client.findFirst({ where: { name: { equals: name, mode: "insensitive" } } });

  let portalUserId: string | undefined;
  if (wantsPortal) {
    const passwordHash = await bcrypt.hash(portalPassword, 10);
    const portalUser = await prisma.user.create({
      data: { name, email: portalEmail, passwordHash, role: "CLIENT" },
    });
    portalUserId = portalUser.id;
  }

  await prisma.client.create({
    data: {
      name,
      role: String(formData.get("role")) as "BUYER" | "SELLER" | "BOTH" | "BANK",
      idNumber: String(formData.get("idNumber") || "") || null,
      phone: String(formData.get("phone") || "") || null,
      email: String(formData.get("email") || "") || null,
      address: String(formData.get("address") || "") || null,
      conflict: !!existing,
      portalUserId,
    },
  });

  await logAudit(session.userId, `Registered new client: ${name}${wantsPortal ? " (with portal login)" : ""}`);

  revalidatePath("/clients");
  redirect("/clients");
}
