import { getCurrentUser } from "@/lib/dal";
import { navForRoleAndPlan } from "@/lib/constants";
import { prisma } from "@/lib/db";
import { getSubscription } from "@/lib/entitlements";
import Shell from "@/components/shell";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const [user, demoMatterCount, subscription] = await Promise.all([
    getCurrentUser(),
    prisma.matter.count({ where: { isDemo: true } }),
    getSubscription(),
  ]);
  const nav = navForRoleAndPlan(user.role, subscription.tier);

  return (
    <Shell nav={nav} user={{ name: user.name, role: user.role }} demoActive={demoMatterCount > 0}>
      {children}
    </Shell>
  );
}
