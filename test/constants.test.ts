import { test } from "node:test";
import assert from "node:assert/strict";
import { fmtMoney, fmtDate, addDays, navForRole, STAGES, STAGE_META } from "../src/lib/constants.ts";

test("fmtMoney formats cents as USD with two decimals", () => {
  assert.equal(fmtMoney(0), "US$0.00");
  assert.equal(fmtMoney(150000), "US$1,500.00");
  assert.equal(fmtMoney(-500), "US$-5.00");
});

test("fmtDate formats a Date as DD Mon YYYY", () => {
  assert.equal(fmtDate(new Date("2026-07-17T00:00:00Z")), "17 Jul 2026");
});

test("fmtDate returns an em dash for null/undefined", () => {
  assert.equal(fmtDate(null), "—");
  assert.equal(fmtDate(undefined), "—");
});

test("addDays advances the date without mutating the input", () => {
  const start = new Date("2026-01-01T00:00:00Z");
  const result = addDays(start, 10);
  assert.equal(result.toISOString().slice(0, 10), "2026-01-11");
  assert.equal(start.toISOString().slice(0, 10), "2026-01-01", "input date must not be mutated");
});

test("navForRole never returns items outside a role's allowed list", () => {
  for (const role of ["ADMINISTRATOR", "CLERK", "CLIENT", "BANK_REPRESENTATIVE"] as const) {
    const items = navForRole(role);
    for (const item of items) {
      assert.ok(item.roles.includes(role), `${item.id} should list ${role} in its roles`);
    }
  }
});

test("navForRole for CLIENT only exposes the portal", () => {
  const items = navForRole("CLIENT");
  assert.deepEqual(
    items.map((i) => i.id),
    ["portal"],
  );
});

test("every stage in STAGES has matching STAGE_META with at least one required doc", () => {
  for (const stage of STAGES) {
    const meta = STAGE_META[stage];
    assert.ok(meta, `missing STAGE_META for ${stage}`);
    assert.ok(meta.docs.length > 0, `${stage} should require at least one document`);
  }
});
