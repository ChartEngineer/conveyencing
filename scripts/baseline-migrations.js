const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { Client } = require("pg");

function loadDatabaseUrl() {
  const content = fs.readFileSync(path.join(__dirname, "..", ".env"), "utf8");
  return content.match(/^DATABASE_URL="(.*)"$/m)[1];
}

const MIGRATIONS = [
  "20260717120000_init",
  "20260717130000_add_files_and_messages",
  "20260717140000_add_immutability_triggers",
  "20260718120000_add_matter_collaborators",
  "20260719120000_add_demo_flags",
  "20260720120000_add_subscription",
  "20260720130000_fix_subscription_singleton",
];

async function main() {
  const client = new Client({ connectionString: loadDatabaseUrl(), ssl: { rejectUnauthorized: false } });
  await client.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS "_prisma_migrations" (
        "id" VARCHAR(36) NOT NULL PRIMARY KEY,
        "checksum" VARCHAR(64) NOT NULL,
        "finished_at" TIMESTAMPTZ,
        "migration_name" VARCHAR(255) NOT NULL,
        "logs" TEXT,
        "rolled_back_at" TIMESTAMPTZ,
        "started_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "applied_steps_count" INTEGER NOT NULL DEFAULT 0
      );
    `);

    for (const name of MIGRATIONS) {
      const existing = await client.query('SELECT 1 FROM "_prisma_migrations" WHERE migration_name = $1', [name]);
      if (existing.rowCount > 0) {
        console.log(`${name} already marked as applied — skipping.`);
        continue;
      }
      const sqlPath = path.join(__dirname, "..", "prisma", "migrations", name, "migration.sql");
      const checksum = crypto.createHash("sha256").update(fs.readFileSync(sqlPath)).digest("hex");
      const id = crypto.randomUUID();
      await client.query(
        `INSERT INTO "_prisma_migrations" (id, checksum, finished_at, migration_name, started_at, applied_steps_count)
         VALUES ($1, $2, now(), $3, now(), 1)`,
        [id, checksum, name],
      );
      console.log(`Marked ${name} as applied (checksum ${checksum}).`);
    }
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
