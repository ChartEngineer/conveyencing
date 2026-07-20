import { prisma } from "@/lib/db";
import { requireNavAccess } from "@/lib/dal";
import NewMatterWizard from "./wizard";

export default async function NewMatterPage() {
  await requireNavAccess("matters");

  const [clients, properties, staff] = await Promise.all([
    prisma.client.findMany({ orderBy: { name: "asc" } }),
    prisma.property.findMany({ orderBy: { standNo: "asc" } }),
    prisma.user.findMany({ where: { role: { not: "CLIENT" } }, orderBy: { name: "asc" } }),
  ]);

  return (
    <NewMatterWizard
      clients={clients.map((c) => ({ id: c.id, name: c.name, role: c.role }))}
      properties={properties.map((p) => ({ id: p.id, standNo: p.standNo, suburb: p.suburb }))}
      staff={staff.map((s) => ({ id: s.id, name: s.name }))}
    />
  );
}
