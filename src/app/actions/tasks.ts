"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { verifySession } from "@/lib/dal";

export async function setTaskStatus(taskId: string, status: "OPEN" | "IN_PROGRESS" | "DONE") {
  await verifySession();
  await prisma.task.update({ where: { id: taskId }, data: { status } });
  revalidatePath("/tasks");
  revalidatePath("/dashboard");
}

export async function createTask(formData: FormData) {
  await verifySession();

  const title = String(formData.get("title") || "").trim();
  if (!title) return;
  const matterId = String(formData.get("matterId") || "") || null;

  await prisma.task.create({
    data: {
      title,
      matterId,
      assigneeName: String(formData.get("assigneeName") || "Unassigned"),
      role: String(formData.get("role")),
      dueDate: new Date(String(formData.get("dueDate"))),
      priority: String(formData.get("priority")) as "HIGH" | "MEDIUM" | "LOW",
      status: "OPEN",
    },
  });

  revalidatePath("/tasks");
  redirect("/tasks");
}
