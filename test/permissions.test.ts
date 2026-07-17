import { test } from "node:test";
import assert from "node:assert/strict";
import { canViewSensitiveData } from "../src/lib/permissions.ts";
import type { StaffRole } from "../src/lib/constants.ts";

test("internal practice roles can view sensitive data", () => {
  const allowed: StaffRole[] = ["ADMINISTRATOR", "PARTNER", "LEGAL_PRACTITIONER", "CONVEYANCING_SECRETARY", "ACCOUNTS_OFFICER"];
  for (const role of allowed) {
    assert.equal(canViewSensitiveData(role), true, `${role} should have sensitive-data access`);
  }
});

test("external/logistics roles cannot view sensitive data", () => {
  const restricted: StaffRole[] = ["CLERK", "ESTATE_AGENT", "BANK_REPRESENTATIVE", "CLIENT"];
  for (const role of restricted) {
    assert.equal(canViewSensitiveData(role), false, `${role} should NOT have sensitive-data access`);
  }
});
