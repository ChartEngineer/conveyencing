import { getCurrentUser } from "@/lib/dal";
import { navForRole } from "@/lib/constants";
import Shell from "@/components/shell";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  const nav = navForRole(user.role);

  return (
    <Shell nav={nav} user={{ name: user.name, role: user.role }}>
      {children}
    </Shell>
  );
}
