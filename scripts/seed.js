const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const { Client } = require("pg");

// Mirrors src/lib/constants.ts STAGES/STAGE_META. Kept in sync manually since this
// script runs standalone (outside Next's TypeScript pipeline).
const STAGES = [
  "Matter Opened", "Instruction Received", "Due Diligence", "Agreement of Sale", "Tax Clearance",
  "Rates Clearance", "Transfer Duty", "Deeds Office Submission", "Registration", "Title Deed Released", "Matter Closed",
];
const STAGE_META = {
  "Matter Opened": { docs: ["Client instruction form"] },
  "Instruction Received": { docs: ["Signed mandate", "Copies of ID/passport"] },
  "Due Diligence": { docs: ["Deeds Office search", "Title deed copy", "Survey diagram"] },
  "Agreement of Sale": { docs: ["Signed Agreement of Sale"] },
  "Tax Clearance": { docs: ["ZIMRA tax clearance certificate"] },
  "Rates Clearance": { docs: ["Local authority rates clearance"] },
  "Transfer Duty": { docs: ["Transfer duty receipt (ZIMRA)"] },
  "Deeds Office Submission": { docs: ["Lodgement cover", "Draft deed of transfer"] },
  Registration: { docs: ["Deeds Office registration confirmation"] },
  "Title Deed Released": { docs: ["Original title deed"] },
  "Matter Closed": { docs: ["Final statement", "Client handover letter"] },
};

function loadDatabaseUrl() {
  const envPath = path.join(__dirname, "..", ".env");
  const content = fs.readFileSync(envPath, "utf8");
  const match = content.match(/^DATABASE_URL="(.*)"$/m);
  if (!match) throw new Error("DATABASE_URL not found in .env");
  return match[1];
}

async function insertRow(client, table, data) {
  const id = data.id || crypto.randomUUID();
  const full = { id, ...data };
  delete full.id;
  const cols = ["id", ...Object.keys(full)];
  const vals = [id, ...Object.values(full)];
  const placeholders = vals.map((_, i) => `$${i + 1}`).join(", ");
  const colNames = cols.map((c) => `"${c}"`).join(", ");
  await client.query(`INSERT INTO "${table}" (${colNames}) VALUES (${placeholders})`, vals);
  return id;
}

function checksFor(stageIndex) {
  const rows = [];
  for (let i = 0; i <= stageIndex; i++) {
    const stage = STAGES[i];
    for (const name of STAGE_META[stage].docs) {
      rows.push({ stage, name, done: i < stageIndex });
    }
  }
  return rows;
}

async function main() {
  const client = new Client({ connectionString: loadDatabaseUrl(), ssl: { rejectUnauthorized: false } });
  await client.connect();

  try {
    const { rows } = await client.query('SELECT COUNT(*)::int AS count FROM "User"');
    if (rows[0].count > 0) {
      console.log("Database already has users — skipping seed.");
      return;
    }

    const passwordHash = await bcrypt.hash("password123", 10);
    const now = new Date();
    const staff = async (email, name, role) => insertRow(client, "User", { email, name, role, passwordHash, createdAt: now });

    const elton = await staff("admin@deeds360.co.zw", "Elton Chapwanya", "ADMINISTRATOR");
    await staff("partner@deeds360.co.zw", "Farai Mutasa", "PARTNER");
    const tapiwa = await staff("tapiwa@deeds360.co.zw", "Tapiwa Chirwa", "LEGAL_PRACTITIONER");
    const rufaro = await staff("rufaro@deeds360.co.zw", "Rufaro Nyathi", "LEGAL_PRACTITIONER");
    const chiedza = await staff("secretary@deeds360.co.zw", "Chiedza Mutasa", "CONVEYANCING_SECRETARY");
    const accounts = await staff("accounts@deeds360.co.zw", "Accounts Officer", "ACCOUNTS_OFFICER");
    const simba = await staff("clerk@deeds360.co.zw", "Simba Madziva", "CLERK");
    await staff("agent@deeds360.co.zw", "Sable Real Estate", "ESTATE_AGENT");
    await staff("bank@deeds360.co.zw", "CBZ Mortgage Desk", "BANK_REPRESENTATIVE");
    const clientUserId = await staff("client@deeds360.co.zw", "Tendai Moyo", "CLIENT");

    const properties = [
      { standNo: "Stand 2145 Borrowdale Township", suburb: "Borrowdale", city: "Harare", titleDeedNo: "DT 3321/2016", surveyDiagram: "SG 998/2016", size: "2,150 m²", valuationCents: 18_500_000, gps: "-17.7460, 31.0850", owner: "Tendai Moyo", fromYear: 2016 },
      { standNo: "Stand 887 Msasa", suburb: "Msasa", city: "Harare", titleDeedNo: "DT 5510/2011", surveyDiagram: "SG 442/2011", size: "4,800 m²", valuationCents: 9_600_000, gps: "-17.8290, 31.1180", owner: "Nyaradzo Estates (Pvt) Ltd", fromYear: 2011 },
      { standNo: "Stand 34 Hillside", suburb: "Hillside", city: "Bulawayo", titleDeedNo: "DT 1187/2019", surveyDiagram: "SG 210/2019", size: "1,800 m²", valuationCents: 7_200_000, gps: "-20.1740, 28.6110", owner: "Precious Dube", fromYear: 2019 },
      { standNo: "Stand 561 Mount Pleasant", suburb: "Mount Pleasant", city: "Harare", titleDeedNo: "DT 902/2014", surveyDiagram: "SG 118/2014", size: "2,600 m²", valuationCents: 21_000_000, gps: "-17.7690, 31.0430", owner: "Precious Dube", fromYear: 2014 },
      { standNo: "Stand 77 Chisipite", suburb: "Chisipite", city: "Harare", titleDeedNo: "DT 4471/2020", surveyDiagram: "SG 761/2020", size: "3,200 m²", valuationCents: 26_500_000, gps: "-17.7770, 31.1060", owner: "Tonderai Marufu (pending)", fromYear: 2026 },
    ];
    const propertyIds = [];
    for (const p of properties) {
      const id = await insertRow(client, "Property", {
        standNo: p.standNo, suburb: p.suburb, city: p.city, titleDeedNo: p.titleDeedNo,
        surveyDiagram: p.surveyDiagram, size: p.size, valuationCents: p.valuationCents, gps: p.gps, createdAt: now,
      });
      await insertRow(client, "PropertyOwner", { propertyId: id, ownerName: p.owner, fromYear: p.fromYear });
      propertyIds.push(id);
    }
    const [pr1, pr2, pr3, pr4, pr5] = propertyIds;

    const clients = [
      { name: "Tendai Moyo", role: "SELLER", idNumber: "63-112233A45", phone: "+263 77 234 5671", email: "tendai.moyo@gmail.com", address: "12 Josiah Chinamano Ave, Harare", kyc: "VERIFIED", portalUserId: clientUserId },
      { name: "Rutendo & Farai Chikwanha", role: "BUYER", idNumber: "63-556677B12", phone: "+263 71 998 4432", email: "rf.chikwanha@outlook.com", address: "8 Enterprise Rd, Highlands, Harare", kyc: "VERIFIED" },
      { name: "Nyaradzo Estates (Pvt) Ltd", role: "SELLER", idNumber: "PVT/2018/00456", phone: "+263 24 277 6541", email: "legal@nyaradzoestates.co.zw", address: "Borrowdale, Harare", kyc: "VERIFIED" },
      { name: "Blessing Ncube", role: "BUYER", idNumber: "08-334455C67", phone: "+263 78 112 2334", email: "blessing.ncube@yahoo.com", address: "44 Fife St, Bulawayo", kyc: "PENDING" },
      { name: "Precious Dube", role: "SELLER", idNumber: "63-887766D21", phone: "+263 73 445 6621", email: "precious.dube@gmail.com", address: "21 Harare Drive, Mount Pleasant", kyc: "VERIFIED" },
      { name: "Tonderai Marufu", role: "BUYER", idNumber: "63-223344E88", phone: "+263 77 665 5443", email: "tmarufu@proton.me", address: "5 Grange Drive, Chisipite", kyc: "VERIFIED" },
      { name: "CBZ Bank Ltd (Mortgage Dept)", role: "BANK", idNumber: "BANK-REG-0091", phone: "+263 24 275 8280", email: "mortgages@cbz.co.zw", address: "Union Ave, Harare", kyc: "VERIFIED" },
      { name: "Farai Gumbo", role: "BUYER", idNumber: "63-778899F34", phone: "+263 71 223 9987", email: "farai.gumbo@gmail.com", address: "19 Coventry Rd, Workington, Harare", kyc: "NOT_STARTED" },
    ];
    const clientIds = [];
    for (const c of clients) {
      const id = await insertRow(client, "Client", { ...c, conflict: false, createdAt: now });
      clientIds.push(id);
    }
    const [tendai, rutendoFarai, nyaradzo, blessing, precious, tonderai, cbz, faraiGumbo] = clientIds;

    const matterSeeds = [
      { reference: "D360/2026/041", type: "SALE", partyIds: [tendai, rutendoFarai], propertyId: pr1, priceCents: 18_500_000, stageIndex: 7, openedDate: "2026-05-04", responsibleId: tapiwa, priority: "HIGH", agent: "Sable Real Estate" },
      { reference: "D360/2026/044", type: "SALE", partyIds: [nyaradzo, blessing], propertyId: pr2, priceCents: 9_600_000, stageIndex: 4, openedDate: "2026-06-01", responsibleId: rufaro, priority: "MEDIUM", agent: "Knight Frank Zimbabwe" },
      { reference: "D360/2026/029", type: "SALE", partyIds: [precious, tonderai], propertyId: pr4, priceCents: 21_000_000, stageIndex: 9, openedDate: "2026-03-02", responsibleId: tapiwa, priority: "MEDIUM", agent: null },
      { reference: "D360/2026/052", type: "PURCHASE", partyIds: [precious, tonderai], propertyId: pr5, priceCents: 26_500_000, stageIndex: 2, openedDate: "2026-06-20", responsibleId: rufaro, priority: "HIGH", agent: "Pam Golding Zimbabwe" },
      { reference: "D360/2026/018", type: "SALE", partyIds: [precious, faraiGumbo], propertyId: pr3, priceCents: 7_200_000, stageIndex: 10, openedDate: "2026-01-15", responsibleId: tapiwa, priority: "LOW", agent: null },
      { reference: "D360/2026/058", type: "BOND_REGISTRATION", partyIds: [rutendoFarai, cbz], propertyId: pr1, priceCents: 18_500_000, stageIndex: 1, openedDate: "2026-07-10", responsibleId: rufaro, priority: "MEDIUM", agent: null },
    ];

    const matterIds = [];
    for (const m of matterSeeds) {
      const openedDate = new Date(m.openedDate);
      const id = await insertRow(client, "Matter", {
        reference: m.reference, type: m.type, propertyId: m.propertyId, priceCents: m.priceCents,
        stageIndex: m.stageIndex, status: m.stageIndex >= STAGES.length - 1 ? "CLOSED" : "ACTIVE",
        openedDate, responsibleId: m.responsibleId, priority: m.priority, agent: m.agent,
        createdAt: openedDate, updatedAt: openedDate,
      });
      for (const clientId of m.partyIds) {
        await client.query('INSERT INTO "MatterClient" ("matterId", "clientId") VALUES ($1, $2)', [id, clientId]);
      }
      for (const check of checksFor(m.stageIndex)) {
        await insertRow(client, "MatterDocumentCheck", { matterId: id, ...check });
      }
      await insertRow(client, "MatterNote", { matterId: id, authorId: m.responsibleId, text: "Matter opened and file created.", createdAt: openedDate });
      matterIds.push(id);
    }
    const [mt1001, mt1002, mt1003, , mt1005, mt1006] = matterIds;

    const notes = [
      { matterId: mt1001, authorId: rufaro, text: "Deeds Office search completed — no encumbrances found.", createdAt: "2026-06-02" },
      { matterId: mt1001, authorId: accounts, text: "ZIMRA tax clearance certificate received and filed.", createdAt: "2026-06-28" },
      { matterId: mt1001, authorId: tapiwa, text: "Rates clearance applied for with Harare City Council; awaiting confirmation.", createdAt: "2026-07-09" },
      { matterId: mt1003, authorId: tapiwa, text: "Transfer duty paid to ZIMRA — receipt on file.", createdAt: "2026-04-20" },
      { matterId: mt1003, authorId: simba, text: "Deed lodged at Deeds Office Harare, reference DO-2026-8834.", createdAt: "2026-06-15" },
      { matterId: mt1003, authorId: simba, text: "Registration confirmed by Deeds Office. Awaiting title deed collection.", createdAt: "2026-07-05" },
    ];
    for (const n of notes) await insertRow(client, "MatterNote", { ...n, createdAt: new Date(n.createdAt) });

    const tasks = [
      { title: "Follow up on rates clearance — Stand 2145 Borrowdale", matterId: mt1001, assigneeName: "Tapiwa Chirwa", role: "Conveyancing Secretary", dueDate: "2026-07-16", priority: "HIGH", status: "OPEN" },
      { title: "Draft Agreement of Sale for Msasa stand", matterId: mt1002, assigneeName: "Rufaro Nyathi", role: "Legal Practitioner", dueDate: "2026-07-15", priority: "HIGH", status: "IN_PROGRESS" },
      { title: "Collect original title deed from Deeds Office", matterId: mt1003, assigneeName: "Simba Madziva", role: "Clerk", dueDate: "2026-07-18", priority: "MEDIUM", status: "OPEN" },
      { title: "Request KYC documents from Blessing Ncube", matterId: mt1002, assigneeName: "Chiedza Mutasa", role: "Conveyancing Secretary", dueDate: "2026-07-17", priority: "MEDIUM", status: "OPEN" },
      { title: "Prepare invoice for closed matter", matterId: mt1005, assigneeName: "Accounts Officer", role: "Accounts Officer", dueDate: "2026-07-15", priority: "LOW", status: "OPEN" },
      { title: "Conduct conflict-of-interest check — new client Farai Gumbo", matterId: null, assigneeName: "Chiedza Mutasa", role: "Conveyancing Secretary", dueDate: "2026-07-14", priority: "HIGH", status: "OPEN" },
      { title: "Bank valuation report follow-up (CBZ)", matterId: mt1006, assigneeName: "Rufaro Nyathi", role: "Legal Practitioner", dueDate: "2026-07-22", priority: "MEDIUM", status: "OPEN" },
      { title: "File signed mandate — Nyaradzo Estates", matterId: mt1002, assigneeName: "Chiedza Mutasa", role: "Conveyancing Secretary", dueDate: "2026-07-10", priority: "MEDIUM", status: "DONE" },
    ];
    for (const t of tasks) await insertRow(client, "Task", { ...t, dueDate: new Date(t.dueDate), createdAt: now });

    const invoices = [
      { matterId: mt1005, clientId: precious, description: "Conveyancing fees — Stand 34 Hillside, Bulawayo", feesCents: 420_000, disbursementsCents: 38_000, status: "OUTSTANDING", date: "2026-07-06", dueDate: "2026-07-21" },
      { matterId: mt1003, clientId: precious, description: "Conveyancing fees — Stand 561 Mount Pleasant", feesCents: 510_000, disbursementsCents: 46_000, status: "PAID", date: "2026-06-10", dueDate: "2026-06-25" },
      { matterId: mt1001, clientId: tendai, description: "Conveyancing fees (interim) — Stand 2145 Borrowdale", feesCents: 480_000, disbursementsCents: 0, status: "OUTSTANDING", date: "2026-07-01", dueDate: "2026-07-16" },
      { matterId: mt1002, clientId: nyaradzo, description: "Instruction & due diligence fees — Stand 887 Msasa", feesCents: 260_000, disbursementsCents: 15_000, status: "OVERDUE", date: "2026-06-05", dueDate: "2026-06-20" },
      { matterId: matterIds[3], clientId: precious, description: "Retainer — Stand 77 Chisipite purchase", feesCents: 300_000, disbursementsCents: 0, status: "PAID", date: "2026-06-22", dueDate: "2026-07-06" },
    ];
    for (const i of invoices) await insertRow(client, "Invoice", { ...i, date: new Date(i.date), dueDate: new Date(i.dueDate) });

    const trust = [
      { matterId: mt1001, type: "DEPOSIT", amountCents: 1_850_000, date: "2026-05-06", description: "Purchase deposit received from Rutendo & Farai Chikwanha (10%)" },
      { matterId: mt1003, type: "DEPOSIT", amountCents: 2_100_000, date: "2026-03-10", description: "Purchase deposit received from Tonderai Marufu" },
      { matterId: mt1003, type: "PAYMENT_OUT", amountCents: -420_000, date: "2026-04-22", description: "Transfer duty paid to ZIMRA" },
      { matterId: mt1005, type: "DEPOSIT", amountCents: 720_000, date: "2026-01-20", description: "Full purchase price received (Farai Gumbo)" },
      { matterId: mt1005, type: "PAYMENT_OUT", amountCents: -660_000, date: "2026-06-30", description: "Balance paid out to seller Precious Dube on registration" },
    ];
    for (const t of trust) await insertRow(client, "TrustTransaction", { ...t, date: new Date(t.date) });

    const auditLog = [
      { userId: chiedza, action: `Uploaded ZIMRA tax clearance certificate to ${matterSeeds[0].reference}`, ts: "2026-07-14T08:12:00" },
      { userId: rufaro, action: `Advanced ${matterSeeds[1].reference} to stage: Tax Clearance`, ts: "2026-07-13T16:40:00" },
      { userId: tapiwa, action: `Generated Agreement of Sale for ${matterSeeds[3].reference}`, ts: "2026-07-12T11:05:00" },
      { userId: accounts, action: `Marked invoice as Paid — ${matterSeeds[3].reference}`, ts: "2026-07-10T09:22:00" },
      { userId: elton, action: "Created new client record: Farai Gumbo", ts: "2026-07-08T14:51:00" },
      { userId: simba, action: `Confirmed registration at Deeds Office for ${matterSeeds[2].reference}`, ts: "2026-07-05T10:03:00" },
    ];
    for (const a of auditLog) await insertRow(client, "AuditLogEntry", { ...a, ts: new Date(a.ts) });

    console.log("Seed complete. Demo logins (password: password123):");
    console.log("  admin@, partner@, tapiwa@, rufaro@, secretary@, accounts@, clerk@, agent@, bank@, client@ (all @deeds360.co.zw)");
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
