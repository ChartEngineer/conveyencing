"use client";

import { useActionState } from "react";
import { login } from "@/app/actions/auth";

export default function LoginForm() {
  const [state, formAction, pending] = useActionState(login, undefined);

  return (
    <form action={formAction}>
      <div className="field">
        <label htmlFor="email">Email</label>
        <input id="email" name="email" type="email" placeholder="you@deeds360.co.zw" required />
      </div>
      <div className="field">
        <label htmlFor="password">Password</label>
        <input id="password" name="password" type="password" required />
      </div>
      {state?.error && (
        <div className="small mb12" style={{ color: "var(--red)" }}>
          {state.error}
        </div>
      )}
      <button className="btn btn-primary" style={{ width: "100%", justifyContent: "center" }} disabled={pending} type="submit">
        {pending ? "Signing in…" : "Sign In"}
      </button>
    </form>
  );
}
