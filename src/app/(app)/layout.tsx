import { getCurrentUser } from "@/lib/dal";
import { navForRole } from "@/lib/constants";
import { prisma } from "@/lib/db";
import Shell from "@/components/shell";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const [user, demoMatterCount] = await Promise.all([getCurrentUser(), prisma.matter.count({ where: { isDemo: true } })]);
  const nav = navForRole(user.role);

  return (
    <Shell nav={nav} user={{ name: user.name, role: user.role }} demoActive={demoMatterCount > 0}>
      {children}
    </Shell>
  );
}
