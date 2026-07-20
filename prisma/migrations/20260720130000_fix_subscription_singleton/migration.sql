-- The original Subscription "singleton" was a check-then-create (findFirst ?? create) pattern,
-- which is not atomic: concurrent calls (e.g. Vercel's build collecting page data across several
-- workers) raced past the check simultaneously and each created its own row, producing many
-- duplicate rows in production. Consolidate back to one row and give it a fixed, well-known id so
-- future access can use an atomic upsert instead.
DELETE FROM "Subscription";
ALTER TABLE "Subscription" ALTER COLUMN "id" SET DEFAULT 'singleton';
