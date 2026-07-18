import Link from "next/link";
import { prisma } from "@/lib/db";
import { fmtDate } from "@/lib/constants";
import { PriorityBadge } from "@/components/badges";
import { setTaskStatus } from "@/app/actions/tasks";
import StatusSelect from "@/components/status-select";
import { requireNavAccess } from "@/lib/dal";
import EmptyState from "@/components/empty-state";

const TASK_STATUS_LABELS = { OPEN: "Open", IN_PROGRESS: "In Progress", DONE: "Done" } as const;

export default async function TasksPage({ searchParams }: { searchParams: Promise<{ filter?: string }> }) {
  await requireNavAccess("tasks");
  const { filter = "All" } = await searchParams;
  const where = filter === "All" ? {} : { status: filter.toUpperCase().replace(" ", "_") as "OPEN" | "IN_PROGRESS" | "DONE" };

  const tasks = await prisma.task.findMany({
    where,
    include: { matter: true },
    orderBy: { dueDate: "asc" },
  });

  const filters = ["All", "Open", "In Progress", "Done"];
  const today = new Date();

  return (
    <>
      <div className="flex-between mb16">
        <div className="flex gap8">
          {filters.map((f) => (
            <Link key={f} href={f === "All" ? "/tasks" : `/tasks?filter=${encodeURIComponent(f)}`} className={`pill-btn ${filter === f ? "active" : ""}`}>
              {f}
            </Link>
          ))}
        </div>
        <Link className="btn btn-primary" href="/tasks/new">
          + New Task
        </Link>
      </div>
      {tasks.length === 0 ? (
        <div className="card">
          <EmptyState
            title={filter === "All" ? "No tasks yet" : `No ${filter.toLowerCase()} tasks`}
            hint={filter === "All" ? "Create a task to track follow-ups on a matter." : undefined}
            actionHref="/tasks/new"
            actionLabel="+ New Task"
          />
        </div>
      ) : (
      <div className="card" style={{ padding: 0 }}>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Task</th>
                <th>Matter</th>
                <th>Assignee</th>
                <th>Role</th>
                <th>Due Date</th>
                <th>Priority</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map((t) => (
                <tr key={t.id}>
                  <td>{t.title}</td>
                  <td className="small">{t.matter?.reference ?? "—"}</td>
                  <td className="small">{t.assigneeName}</td>
                  <td className="small">{t.role}</td>
                  <td className={`small ${t.dueDate < today && t.status !== "DONE" ? "priority-High" : ""}`}>{fmtDate(t.dueDate)}</td>
                  <td>
                    <PriorityBadge priority={t.priority} />
                  </td>
                  <td>
                    <StatusSelect
                      id={t.id}
                      value={t.status}
                      options={["OPEN", "IN_PROGRESS", "DONE"]}
                      labels={TASK_STATUS_LABELS}
                      onChange={setTaskStatus}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      )}
    </>
  );
}
