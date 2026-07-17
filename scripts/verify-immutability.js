const fs = require("fs");
const path = require("path");
const { Client } = require("pg");

function loadDatabaseUrl() {
  const content = fs.readFileSync(path.join(__dirname, "..", ".env"), "utf8");
  return content.match(/^DATABASE_URL="(.*)"$/m)[1];
}

async function main() {
  const client = new Client({ connectionString: loadDatabaseUrl(), ssl: { rejectUnauthorized: false } });
  await client.connect();
  try {
    const { rows } = await client.query('SELECT id FROM "TrustTransaction" LIMIT 1');
    if (rows.length === 0) {
      console.log("No trust transactions to test against.");
      return;
    }
    const id = rows[0].id;

    try {
      await client.query('UPDATE "TrustTransaction" SET "amountCents" = 999 WHERE id = $1', [id]);
      console.log("FAIL: UPDATE succeeded — trigger did not block it.");
    } catch (err) {
      console.log("PASS: UPDATE blocked —", err.message);
    }

    try {
      await client.query('DELETE FROM "TrustTransaction" WHERE id = $1', [id]);
      console.log("FAIL: DELETE succeeded — trigger did not block it.");
    } catch (err) {
      console.log("PASS: DELETE blocked —", err.message);
    }
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
