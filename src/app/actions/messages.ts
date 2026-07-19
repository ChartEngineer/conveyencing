"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { assertMatterAccess } from "@/lib/dal";

export async function sendMessage(matterId: string, formData: FormData) {
  const user = await assertMatterAccess(matterId);
  const body = String(formData.get("body") || "").trim();
  if (!body) return;

  await prisma.message.create({ data: { matterId, senderId: user.id, body } });

  revalidatePath(`/matters/${matterId}`);
  revalidatePath("/portal");
  revalidatePath("/collab");
}
