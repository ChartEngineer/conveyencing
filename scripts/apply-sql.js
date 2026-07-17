const fs = require("fs");
const path = require("path");
const { Client } = require("pg");

function loadDatabaseUrl() {
  const envPath = path.join(__dirname, "..", ".env");
  const content = fs.readFileSync(envPath, "utf8");
  const match = content.match(/^DATABASE_URL="(.*)"$/m);
  if (!match) throw new Error("DATABASE_URL not found in .env");
  return match[1];
}

async function main() {
  const sqlFile = process.argv[2];
  if (!sqlFile) {
    console.error("Usage: node scripts/apply-sql.js <path-to-sql-file>");
    process.exit(1);
  }
  const sql = fs.readFileSync(sqlFile, "utf8");
  const client = new Client({ connectionString: loadDatabaseUrl(), ssl: { rejectUnauthorized: false } });
  await client.connect();
  try {
    await client.query(sql);
    console.log(`Applied ${sqlFile} successfully.`);
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
