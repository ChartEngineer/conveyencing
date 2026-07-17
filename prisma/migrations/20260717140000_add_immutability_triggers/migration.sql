-- Trust ledger and audit log must be append-only: no application code path may ever update or
-- delete a row in these tables, even by accident or via a future bug. Postgres triggers enforce
-- this at the database level regardless of which role executes the query (unlike GRANT/REVOKE,
-- which superuser/service-role connections bypass entirely) — correcting a mistake means writing
-- a new offsetting entry, never editing history.

CREATE OR REPLACE FUNCTION prevent_mutation() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION '% records are immutable (append-only) — % is not permitted. Insert a new offsetting/correcting entry instead.', TG_TABLE_NAME, TG_OP;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trust_transaction_no_update
  BEFORE UPDATE ON "TrustTransaction"
  FOR EACH ROW EXECUTE FUNCTION prevent_mutation();

CREATE TRIGGER trust_transaction_no_delete
  BEFORE DELETE ON "TrustTransaction"
  FOR EACH ROW EXECUTE FUNCTION prevent_mutation();

CREATE TRIGGER audit_log_entry_no_update
  BEFORE UPDATE ON "AuditLogEntry"
  FOR EACH ROW EXECUTE FUNCTION prevent_mutation();

CREATE TRIGGER audit_log_entry_no_delete
  BEFORE DELETE ON "AuditLogEntry"
  FOR EACH ROW EXECUTE FUNCTION prevent_mutation();
