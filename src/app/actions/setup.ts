"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { createSession } from "@/lib/session";

export type SetupState = { error?: string } | undefined;

export async function bootstrapAdmin(_prevState: SetupState, formData: FormData): Promise<SetupState> {
  // Re-check server-side: this route must not work once any account exists, even if the
  // page was loaded before someone else's setup submission completed.
  const existingUsers = await prisma.user.count();
  if (existingUsers > 0) {
    redirect("/login");
  }

  const name = String(formData.get("name") || "").trim();
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");

  if (!name || !email || !password || password.length < 8) {
    return { error: "Please fill in all fields — password must be at least 8 characters." };
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: { name, email, role: "ADMINISTRATOR", passwordHash },
  });

  await createSession({ userId: user.id, role: user.role, name: user.name });
  redirect("/dashboard");
}
