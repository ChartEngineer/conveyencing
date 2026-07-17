"use client";

import { useActionState, useState } from "react";
import { createClient } from "@/app/actions/clients";

export default function NewClientForm() {
  const [state, formAction, pending] = useActionState(createClient, undefined);
  const [wantsPortal, setWantsPortal] = useState(false);

  return (
    <form action={formAction}>
      <div className="field">
        <label htmlFor="name">Full Name / Entity Name</label>
        <input id="name" name="name" placeholder="e.g. Tatenda Mhere" required />
      </div>
      <div className="field-row">
        <div className="field">
          <label htmlFor="role">Role</label>
          <select id="role" name="role" defaultValue="BUYER">
            <option value="BUYER">Buyer</option>
            <option value="SELLER">Seller</option>
            <option value="BOTH">Both</option>
            <option value="BANK">Bank</option>
          </select>
        </div>
        <div className="field">
          <label htmlFor="idNumber">National ID / Passport / Reg No.</label>
          <input id="idNumber" name="idNumber" placeholder="63-XXXXXXX-X-XX" />
        </div>
      </div>
      <div className="field-row">
        <div className="field">
          <label htmlFor="phone">Phone</label>
          <input id="phone" name="phone" placeholder="+263 7X XXX XXXX" />
        </div>
        <div className="field">
          <label htmlFor="email">Email</label>
          <input id="email" name="email" type="email" placeholder="name@email.com" />
        </div>
      </div>
      <div className="field">
        <label htmlFor="address">Address</label>
        <input id="address" name="address" placeholder="Street, Suburb, City" />
      </div>
      <div className="hint mb12">A conflict-of-interest check will run automatically against existing clients when saved.</div>

      <div className="field">
        <label style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 400 }}>
          <input
            type="checkbox"
            name="createPortalLogin"
            style={{ width: "auto" }}
            checked={wantsPortal}
            onChange={(e) => setWantsPortal(e.target.checked)}
          />
          Create a Client Portal login for this client
        </label>
      </div>
      {wantsPortal && (
        <div className="field-row">
          <div className="field">
            <label htmlFor="portalEmail">Portal Login Email</label>
            <input id="portalEmail" name="portalEmail" type="email" placeholder="client@email.com" required={wantsPortal} />
          </div>
          <div className="field">
            <label htmlFor="portalPassword">Temporary Password</label>
            <input id="portalPassword" name="portalPassword" type="password" minLength={8} required={wantsPortal} />
          </div>
        </div>
      )}

      {state?.error && (
        <div className="small mb12" style={{ color: "var(--red)" }}>
          {state.error}
        </div>
      )}
      <button className="btn btn-primary" type="submit" disabled={pending}>
        {pending ? "Saving…" : "Save Client"}
      </button>
    </form>
  );
}
