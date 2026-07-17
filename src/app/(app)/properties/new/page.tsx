import Link from "next/link";
import { prisma } from "@/lib/db";
import { createProperty } from "@/app/actions/properties";
import { requireNavAccess } from "@/lib/dal";

export default async function NewPropertyPage() {
  await requireNavAccess("properties");

  const clients = await prisma.client.findMany({ orderBy: { name: "asc" } });

  return (
    <div className="card" style={{ maxWidth: 640 }}>
      <div className="flex-between mb16">
        <h3 style={{ margin: 0 }}>Register Property</h3>
        <Link href="/properties" className="small muted">
          Cancel
        </Link>
      </div>
      <form action={createProperty}>
        <div className="field">
          <label htmlFor="standNo">Stand Number / Description</label>
          <input id="standNo" name="standNo" placeholder="e.g. Stand 12 Greendale" required />
        </div>
        <div className="field-row">
          <div className="field">
            <label htmlFor="suburb">Suburb</label>
            <input id="suburb" name="suburb" placeholder="e.g. Greendale" required />
          </div>
          <div className="field">
            <label htmlFor="city">City</label>
            <select id="city" name="city" defaultValue="Harare">
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
            <label htmlFor="titleDeedNo">Title Deed No.</label>
            <input id="titleDeedNo" name="titleDeedNo" placeholder="DT XXXX/YYYY" />
          </div>
          <div className="field">
            <label htmlFor="surveyDiagram">Survey Diagram No.</label>
            <input id="surveyDiagram" name="surveyDiagram" placeholder="SG XXXX/YYYY" />
          </div>
        </div>
        <div className="field-row">
          <div className="field">
            <label htmlFor="size">Size</label>
            <input id="size" name="size" placeholder="e.g. 2,000 m²" />
          </div>
          <div className="field">
            <label htmlFor="valuation">Valuation (US$)</label>
            <input id="valuation" name="valuation" type="number" placeholder="120000" />
          </div>
        </div>
        <div className="field">
          <label htmlFor="gps">GPS Coordinates</label>
          <input id="gps" name="gps" placeholder="-17.XXXX, 31.XXXX" />
        </div>
        <div className="field">
          <label htmlFor="owner">Current Owner</label>
          <select id="owner" name="owner">
            {clients.map((c) => (
              <option key={c.id} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <button className="btn btn-primary" type="submit">
          Save Property
        </button>
      </form>
    </div>
  );
}
