"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { verifySession } from "@/lib/dal";

export async function sendMessage(matterId: string, formData: FormData) {
  const session = await verifySession();
  const body = String(formData.get("body") || "").trim();
  if (!body) return;

  await prisma.message.create({ data: { matterId, senderId: session.userId, body } });

  revalidatePath(`/matters/${matterId}`);
  revalidatePath("/portal");
}
