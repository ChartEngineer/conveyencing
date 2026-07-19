"use client";

import { useActionState } from "react";
import { acceptInvite } from "@/app/actions/invite";

export default function AcceptInviteForm({ token, email, needsPassword }: { token: string; email: string; needsPassword: boolean }) {
  const acceptWithToken = acceptInvite.bind(null, token);
  const [state, formAction, pending] = useActionState(acceptWithToken, undefined);

  return (
    <form action={formAction}>
      <div className="field">
        <label htmlFor="email">Email</label>
        <input id="email" value={email} disabled />
      </div>
      {needsPassword && (
        <div className="field">
          <label htmlFor="password">Choose a password</label>
          <input id="password" name="password" type="password" minLength={8} required />
        </div>
      )}
      {state?.error && (
        <div className="small mb12" style={{ color: "var(--red)" }}>
          {state.error}
        </div>
      )}
      <button className="btn btn-primary" style={{ width: "100%", justifyContent: "center" }} disabled={pending} type="submit">
        {pending ? "Please wait…" : needsPassword ? "Create Account & Accept" : "Accept & Continue"}
      </button>
    </form>
  );
}
