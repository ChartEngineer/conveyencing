import "server-only";
import { prisma } from "@/lib/db";

export async function logAudit(userId: string, action: string) {
  await prisma.auditLogEntry.create({ data: { userId, action } });
}
