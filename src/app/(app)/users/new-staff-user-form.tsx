"use client";

import { useActionState } from "react";
import { createStaffUser } from "@/app/actions/users";
import { STAFF_ROLE_LABELS } from "@/lib/constants";

const ASSIGNABLE_ROLES = Object.keys(STAFF_ROLE_LABELS).filter((r) => r !== "CLIENT") as (keyof typeof STAFF_ROLE_LABELS)[];

export default function NewStaffUserForm() {
  const [state, formAction, pending] = useActionState(createStaffUser, undefined);

  return (
    <form action={formAction}>
      <div className="field">
        <label htmlFor="name">Full Name</label>
        <input id="name" name="name" required />
      </div>
      <div className="field">
        <label htmlFor="email">Email</label>
        <input id="email" name="email" type="email" required />
      </div>
      <div className="field">
        <label htmlFor="role">Role</label>
        <select id="role" name="role" defaultValue="CONVEYANCING_SECRETARY">
          {ASSIGNABLE_ROLES.map((r) => (
            <option key={r} value={r}>
              {STAFF_ROLE_LABELS[r]}
            </option>
          ))}
        </select>
      </div>
      <div className="field">
        <label htmlFor="password">Temporary Password</label>
        <input id="password" name="password" type="password" minLength={8} required />
        <div className="hint">At least 8 characters. Share this with the new staff member securely.</div>
      </div>
      {state?.error && (
        <div className="small mb12" style={{ color: "var(--red)" }}>
          {state.error}
        </div>
      )}
      <button className="btn btn-primary" type="submit" disabled={pending}>
        {pending ? "Creating…" : "Create Account"}
      </button>
    </form>
  );
}
