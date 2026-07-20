"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { createMatterFromWizard } from "@/app/actions/matters";

type ClientOption = { id: string; name: string; role: string };
type PropertyOption = { id: string; standNo: string; suburb: string };
type StaffOption = { id: string; name: string };

const STEPS = ["Parties", "Property", "Matter"];

export default function NewMatterWizard({
  clients,
  properties,
  staff,
}: {
  clients: ClientOption[];
  properties: PropertyOption[];
  staff: StaffOption[];
}) {
  const [step, setStep] = useState(1);
  const [stepError, setStepError] = useState("");
  const [addNewClient, setAddNewClient] = useState(clients.length === 0);
  const [addNewProperty, setAddNewProperty] = useState(properties.length === 0);
  const [submitting, setSubmitting] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  function fieldValue(name: string) {
    if (!formRef.current) return "";
    const el = formRef.current.elements.namedItem(name);
    if (el instanceof HTMLSelectElement) return [...el.selectedOptions].map((o) => o.value).join(",");
    if (el instanceof RadioNodeList || el instanceof HTMLInputElement) return (el as HTMLInputElement).value;
    return "";
  }

  function next() {
    setStepError("");
    if (step === 1) {
      const hasExisting = fieldValue("clientIds") !== "";
      const hasNew = addNewClient && fieldValue("newClientName").trim() !== "";
      if (!hasExisting && !hasNew) {
        setStepError("Select at least one existing party, or register a new one.");
        return;
      }
    }
    if (step === 2) {
      const hasExisting = !addNewProperty && fieldValue("propertyId") !== "";
      const hasNew = addNewProperty && fieldValue("newStandNo").trim() !== "";
      if (!hasExisting && !hasNew) {
        setStepError("Select an existing property, or register a new one.");
        return;
      }
    }
    setStep((s) => Math.min(3, s + 1));
  }

  function back() {
    setStepError("");
    setStep((s) => Math.max(1, s - 1));
  }

  return (
    <div className="card" style={{ maxWidth: 640 }}>
      <div className="flex-between mb16">
        <h3 style={{ margin: 0 }}>New Matter</h3>
        <Link href="/matters" className="small muted">
          Cancel
        </Link>
      </div>

      <div className="flex gap8 mb20">
        {STEPS.map((label, i) => (
          <div
            key={label}
            className="small"
            style={{
              flex: 1,
              textAlign: "center",
              fontWeight: step === i + 1 ? 700 : 400,
              color: step === i + 1 ? "var(--navy)" : step > i + 1 ? "var(--green)" : "var(--muted)",
            }}
          >
            {step > i + 1 ? "✓ " : `${i + 1}. `}
            {label}
          </div>
        ))}
      </div>

      <form ref={formRef} action={createMatterFromWizard} onSubmit={() => setSubmitting(true)}>
        {/* Step 1: Parties — kept mounted (display:none when inactive) so field values survive navigation */}
        <div style={{ display: step === 1 ? "block" : "none" }}>
          <div className="field">
            <label htmlFor="clientIds">Select existing parties (optional)</label>
            <select id="clientIds" name="clientIds" multiple size={5}>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.role})
                </option>
              ))}
            </select>
            <div className="hint">Hold Ctrl/Cmd to select multiple parties.</div>
          </div>
          <div className="field">
            <label style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 400 }}>
              <input
                type="checkbox"
                style={{ width: "auto" }}
                checked={addNewClient}
                onChange={(e) => setAddNewClient(e.target.checked)}
              />
              Also register a new party for this matter
            </label>
          </div>
          {addNewClient && (
            <div style={{ border: "1px solid var(--border)", borderRadius: 8, padding: 12 }}>
              <div className="field">
                <label htmlFor="newClientName">Full Name / Entity Name</label>
                <input id="newClientName" name="newClientName" placeholder="e.g. Tatenda Mhere" />
              </div>
              <div className="field-row">
                <div className="field">
                  <label htmlFor="newClientRole">Role</label>
                  <select id="newClientRole" name="newClientRole" defaultValue="BUYER">
                    <option value="BUYER">Buyer</option>
                    <option value="SELLER">Seller</option>
                    <option value="BOTH">Both</option>
                    <option value="BANK">Bank</option>
                  </select>
                </div>
                <div className="field">
                  <label htmlFor="newClientIdNumber">National ID / Passport / Reg No.</label>
                  <input id="newClientIdNumber" name="newClientIdNumber" placeholder="63-XXXXXXX-X-XX" />
                </div>
              </div>
              <div className="field-row">
                <div className="field">
                  <label htmlFor="newClientPhone">Phone</label>
                  <input id="newClientPhone" name="newClientPhone" placeholder="+263 7X XXX XXXX" />
                </div>
                <div className="field">
                  <label htmlFor="newClientEmail">Email</label>
                  <input id="newClientEmail" name="newClientEmail" type="email" placeholder="name@email.com" />
                </div>
              </div>
              <div className="field">
                <label htmlFor="newClientAddress">Address</label>
                <input id="newClientAddress" name="newClientAddress" placeholder="Street, Suburb, City" />
              </div>
              <div className="hint">A conflict-of-interest check will run automatically against existing clients when saved.</div>
            </div>
          )}
        </div>

        {/* Step 2: Property */}
        <div style={{ display: step === 2 ? "block" : "none" }}>
          {properties.length > 0 && !addNewProperty && (
            <div className="field">
              <label htmlFor="propertyId">Select an existing property</label>
              <select id="propertyId" name="propertyId">
                <option value="">— Choose a property —</option>
                {properties.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.standNo} — {p.suburb}
                  </option>
                ))}
              </select>
            </div>
          )}
          {properties.length > 0 && (
            <div className="field">
              <label style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 400 }}>
                <input
                  type="checkbox"
                  style={{ width: "auto" }}
                  checked={addNewProperty}
                  onChange={(e) => setAddNewProperty(e.target.checked)}
                />
                Register a new property instead
              </label>
            </div>
          )}
          {addNewProperty && (
            <div style={{ border: "1px solid var(--border)", borderRadius: 8, padding: 12 }}>
              <div className="field">
                <label htmlFor="newStandNo">Stand Number / Description</label>
                <input id="newStandNo" name="newStandNo" placeholder="e.g. Stand 12 Greendale" />
              </div>
              <div className="field-row">
                <div className="field">
                  <label htmlFor="newSuburb">Suburb</label>
                  <input id="newSuburb" name="newSuburb" placeholder="e.g. Greendale" />
                </div>
                <div className="field">
                  <label htmlFor="newCity">City</label>
                  <select id="newCity" name="newCity" defaultValue="Harare">
                    <option>Harare</option>
                    <option>Bulawayo</option>
                    <option>Mutare</option>
                    <option>Gweru</option>
                    <option>Masvingo</option>
                  </select>
                </div>
              </div>
              <div className="field-row">
                <div className="field">
                  <label htmlFor="newTitleDeedNo">Title Deed No.</label>
                  <input id="newTitleDeedNo" name="newTitleDeedNo" placeholder="DT XXXX/YYYY" />
                </div>
                <div className="field">
                  <label htmlFor="newSurveyDiagram">Survey Diagram No.</label>
                  <input id="newSurveyDiagram" name="newSurveyDiagram" placeholder="SG XXXX/YYYY" />
                </div>
              </div>
              <div className="field-row">
                <div className="field">
                  <label htmlFor="newSize">Size</label>
                  <input id="newSize" name="newSize" placeholder="e.g. 2,000 m²" />
                </div>
                <div className="field">
                  <label htmlFor="newValuation">Valuation (US$)</label>
                  <input id="newValuation" name="newValuation" type="number" placeholder="120000" />
                </div>
              </div>
              <div className="field">
                <label htmlFor="newGps">GPS Coordinates</label>
                <input id="newGps" name="newGps" placeholder="-17.XXXX, 31.XXXX" />
              </div>
            </div>
          )}
        </div>

        {/* Step 3: Matter details */}
        <div style={{ display: step === 3 ? "block" : "none" }}>
          <div className="field">
            <label htmlFor="type">Matter Type</label>
            <select id="type" name="type" defaultValue="SALE">
              <option value="SALE">Sale</option>
              <option value="PURCHASE">Purchase</option>
              <option value="BOND_REGISTRATION">Bond Registration</option>
            </select>
          </div>
          <div className="field-row">
            <div className="field">
              <label htmlFor="price">Agreed Price (US$)</label>
              <input id="price" name="price" type="number" defaultValue={100000} />
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
          <div className="field">
            <label htmlFor="responsibleId">Responsible Legal Practitioner</label>
            <select id="responsibleId" name="responsibleId">
              {staff.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {stepError && (
          <div className="small mb12" style={{ color: "var(--red)" }}>
            {stepError}
          </div>
        )}

        <div className="flex-between mt16">
          {step > 1 ? (
            <button type="button" className="btn btn-ghost" onClick={back}>
              Back
            </button>
          ) : (
            <span />
          )}
          {step < 3 ? (
            <button type="button" className="btn btn-primary" onClick={next} disabled={submitting}>
              Next
            </button>
          ) : (
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? "Creating…" : "Create Matter"}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
