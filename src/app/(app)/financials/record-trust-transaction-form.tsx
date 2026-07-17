"use client";

import { useActionState } from "react";
import { recordTrustTransaction } from "@/app/actions/trust";

export default function RecordTrustTransactionForm({ matters }: { matters: { id: string; reference: string }[] }) {
  const [state, formAction, pending] = useActionState(recordTrustTransaction, undefined);

  return (
    <form action={formAction}>
      <div className="field">
        <label htmlFor="matterId">Matter</label>
        <select id="matterId" name="matterId" required>
          {matters.map((m) => (
            <option key={m.id} value={m.id}>
              {m.reference}
            </option>
          ))}
        </select>
      </div>
      <div className="field-row">
        <div className="field">
          <label htmlFor="type">Type</label>
          <select id="type" name="type" defaultValue="DEPOSIT">
            <option value="DEPOSIT">Deposit</option>
            <option value="PAYMENT_OUT">Payment Out</option>
          </select>
        </div>
        <div className="field">
          <label htmlFor="amount">Amount (US$)</label>
          <input id="amount" name="amount" type="number" min="0.01" step="0.01" required />
        </div>
      </div>
      <div className="field">
        <label htmlFor="description">Description</label>
        <input id="description" name="description" placeholder="e.g. Deposit received from buyer" required />
      </div>
      {state?.error && (
        <div className="small mb12" style={{ color: "var(--red)" }}>
          {state.error}
        </div>
      )}
      <button className="btn btn-primary" type="submit" disabled={pending}>
        {pending ? "Recording…" : "Record Transaction"}
      </button>
    </form>
  );
}
