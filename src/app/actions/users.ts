"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/dal";
import { logAudit } from "@/lib/audit";

export type CreateStaffState = { error?: string } | undefined;

export async function createStaffUser(_prevState: CreateStaffState, formData: FormData): Promise<CreateStaffState> {
  const currentUser = await getCurrentUser();
  if (currentUser.role !== "ADMINISTRATOR") {
    return { error: "Only administrators can create staff accounts." };
  }

  const name = String(formData.get("name") || "").trim();
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const role = String(formData.get("role"));
  const password = String(formData.get("password") || "");

  if (!name || !email || !password || password.length < 8) {
    return { error: "Please fill in all fields — password must be at least 8 characters." };
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { error: "A user with that email already exists." };
  }

  const passwordHash = await bcrypt.hash(password, 10);

  await prisma.user.create({
    data: {
      name,
      email,
      role: role as
        | "ADMINISTRATOR"
        | "PARTNER"
        | "LEGAL_PRACTITIONER"
        | "CONVEYANCING_SECRETARY"
        | "ACCOUNTS_OFFICER"
        | "CLERK"
        | "ESTATE_AGENT"
        | "BANK_REPRESENTATIVE",
      passwordHash,
    },
  });

  await logAudit(currentUser.id, `Created staff account: ${name} (${role})`);

  revalidatePath("/users");
  redirect("/users");
}
