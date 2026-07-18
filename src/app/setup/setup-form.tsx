"use client";

import { useActionState } from "react";
import { bootstrapAdmin } from "@/app/actions/setup";

export default function SetupForm() {
  const [state, formAction, pending] = useActionState(bootstrapAdmin, undefined);

  return (
    <form action={formAction}>
      <div className="field">
        <label htmlFor="name">Full name</label>
        <input id="name" name="name" placeholder="Your name" required />
      </div>
      <div className="field">
        <label htmlFor="email">Email</label>
        <input id="email" name="email" type="email" placeholder="you@deeds360.co.zw" required />
      </div>
      <div className="field">
        <label htmlFor="password">Password</label>
        <input id="password" name="password" type="password" minLength={8} required />
      </div>
      {state?.error && (
        <div className="small mb12" style={{ color: "var(--red)" }}>
          {state.error}
        </div>
      )}
      <button className="btn btn-primary" style={{ width: "100%", justifyContent: "center" }} disabled={pending} type="submit">
        {pending ? "Creating…" : "Create Administrator Account"}
      </button>
      <div className="hint mt12">
        This page only works while the system has no accounts. Once this account is created, /setup will redirect to
        the login page.
      </div>
    </form>
  );
}
