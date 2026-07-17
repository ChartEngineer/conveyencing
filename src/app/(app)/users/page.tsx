import { requireNavAccess } from "@/lib/dal";
import { prisma } from "@/lib/db";
import { STAFF_ROLE_LABELS } from "@/lib/constants";
import { fmtDate } from "@/lib/constants";
import NewStaffUserForm from "./new-staff-user-form";

export default async function UsersPage() {
  await requireNavAccess("users");

  const users = await prisma.user.findMany({ where: { role: { not: "CLIENT" } }, orderBy: { createdAt: "asc" } });

  return (
    <div className="grid grid-2">
      <div className="card" style={{ padding: 0 }}>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Since</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td className="small">{u.name}</td>
                  <td className="small">{u.email}</td>
                  <td>
                    <span className="badge badge-blue">{STAFF_ROLE_LABELS[u.role]}</span>
                  </td>
                  <td className="small">{fmtDate(u.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div className="card">
        <h3>Add Staff Account</h3>
        <NewStaffUserForm />
      </div>
    </div>
  );
}
