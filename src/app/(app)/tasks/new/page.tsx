import Link from "next/link";
import { prisma } from "@/lib/db";
import { createTask } from "@/app/actions/tasks";
import { requireNavAccess } from "@/lib/dal";

export default async function NewTaskPage() {
  await requireNavAccess("tasks");

  const matters = await prisma.matter.findMany({ orderBy: { createdAt: "desc" } });
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="card" style={{ maxWidth: 560 }}>
      <div className="flex-between mb16">
        <h3 style={{ margin: 0 }}>New Task</h3>
        <Link href="/tasks" className="small muted">
          Cancel
        </Link>
      </div>
      <form action={createTask}>
        <div className="field">
          <label htmlFor="title">Task Title</label>
          <input id="title" name="title" placeholder="e.g. Follow up on tax clearance" required />
        </div>
        <div className="field">
          <label htmlFor="matterId">Related Matter (optional)</label>
          <select id="matterId" name="matterId" defaultValue="">
            <option value="">— None —</option>
            {matters.map((m) => (
              <option key={m.id} value={m.id}>
                {m.reference}
              </option>
            ))}
          </select>
        </div>
        <div className="field-row">
          <div className="field">
            <label htmlFor="assigneeName">Assignee</label>
            <input id="assigneeName" name="assigneeName" placeholder="e.g. Chiedza Mutasa" required />
          </div>
          <div className="field">
            <label htmlFor="role">Role</label>
            <select id="role" name="role" defaultValue="Legal Practitioner">
              {["Legal Practitioner", "Conveyancing Secretary", "Accounts Officer", "Clerk", "Partner"].map((r) => (
                <option key={r}>{r}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="field-row">
          <div className="field">
            <label htmlFor="dueDate">Due Date</label>
            <input id="dueDate" name="dueDate" type="date" defaultValue={today} required />
          </div>
          <div className="field">
            <label htmlFor="priority">Priority</label>
            <select id="priority" name="priority" defaultValue="MEDIUM">
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>
          </div>
        </div>
        <button className="btn btn-primary" type="submit">
          Create Task
        </button>
      </form>
    </div>
  );
}
