const fs = require("fs");
const path = require("path");
const { Client } = require("pg");

function loadDatabaseUrl() {
  const content = fs.readFileSync(path.join(__dirname, "..", ".env"), "utf8");
  return content.match(/^DATABASE_URL="(.*)"$/m)[1];
}

// Every table in the schema that holds data, in no particular order — TRUNCATE-ing them all
// together in one statement sidesteps FK ordering (no CASCADE needed) and, being a statement-level
// operation rather than a per-row DELETE, does not trip the immutability triggers on
// TrustTransaction/AuditLogEntry (those only fire on row-level UPDATE/DELETE).
const TABLES = [
  "MatterFile",
  "Message",
  "MatterNote",
  "Task",
  "Invoice",
  "TrustTransaction",
  "MatterDocumentCheck",
  "MatterClient",
  "Matter",
  "PropertyOwner",
  "Property",
  "AuditLogEntry",
  "Client",
  "User",
];

async function main() {
  const client = new Client({ connectionString: loadDatabaseUrl(), ssl: { rejectUnauthorized: false } });
  await client.connect();
  try {
    console.log("Row counts before wipe:");
    for (const table of TABLES) {
      const { rows } = await client.query(`SELECT COUNT(*) FROM "${table}"`);
      console.log(`  ${table}: ${rows[0].count}`);
    }

    const tableList = TABLES.map((t) => `"${t}"`).join(", ");
    console.log("\nTruncating all tables...");
    await client.query(`TRUNCATE TABLE ${tableList}`);

    console.log("\nRow counts after wipe:");
    for (const table of TABLES) {
      const { rows } = await client.query(`SELECT COUNT(*) FROM "${table}"`);
      console.log(`  ${table}: ${rows[0].count}`);
      if (rows[0].count !== "0") {
        throw new Error(`${table} still has rows after TRUNCATE`);
      }
    }
    console.log("\nDone. Database is empty — visiting the app will now redirect to /setup.");
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
