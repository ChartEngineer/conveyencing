import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/dal";
import { logAudit } from "@/lib/audit";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  const { id } = await params;

  const file = await prisma.matterFile.findUnique({
    where: { id },
    include: { matter: { include: { clients: { include: { client: true } } } } },
  });

  if (!file) return new NextResponse("Not found", { status: 404 });

  if (user.role === "CLIENT") {
    const clientProfile = await prisma.client.findUnique({ where: { portalUserId: user.id } });
    const isParty = clientProfile && file.matter.clients.some((c) => c.clientId === clientProfile.id);
    if (!isParty) return new NextResponse("Forbidden", { status: 403 });
  }

  await logAudit(user.id, `Downloaded "${file.fileName}" from ${file.matter.reference}`);

  return new NextResponse(new Uint8Array(file.data), {
    headers: {
      "Content-Type": file.mimeType,
      "Content-Disposition": `attachment; filename="${encodeURIComponent(file.fileName)}"`,
      "Content-Length": String(file.sizeBytes),
    },
  });
}
