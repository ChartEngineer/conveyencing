"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { verifySession } from "@/lib/dal";
import { logAudit } from "@/lib/audit";
import { MAX_UPLOAD_BYTES, ALLOWED_UPLOAD_MIME_TYPES } from "@/lib/upload-limits";

// Enforced server-side, not just via the file input's `accept` attribute — a malicious client can
// send any content type/size regardless of what the browser's picker suggests.
export async function uploadMatterFile(matterId: string, documentCheckId: string | null, formData: FormData) {
  const session = await verifySession();

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return;

  if (file.size > MAX_UPLOAD_BYTES) {
    throw new Error(`File is too large (${(file.size / (1024 * 1024)).toFixed(1)} MB) — the limit is 10 MB.`);
  }
  const mimeType = file.type || "application/octet-stream";
  if (!ALLOWED_UPLOAD_MIME_TYPES.includes(mimeType)) {
    throw new Error(`File type "${mimeType}" is not allowed. Upload a PDF, Word/Excel document, plain text, or common image format.`);
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const matter = await prisma.matter.findUniqueOrThrow({ where: { id: matterId } });

  await prisma.matterFile.create({
    data: {
      matterId,
      documentCheckId,
      fileName: file.name,
      mimeType,
      sizeBytes: file.size,
      data: buffer,
      uploadedById: session.userId,
    },
  });

  if (documentCheckId) {
    await prisma.matterDocumentCheck.update({ where: { id: documentCheckId }, data: { done: true } });
  }

  await logAudit(session.userId, `Uploaded "${file.name}" to ${matter.reference}`);

  revalidatePath(`/matters/${matterId}`);
  revalidatePath("/portal");
}
