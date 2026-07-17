import { test } from "node:test";
import assert from "node:assert/strict";
import { resolveSellerAndBuyer, generateDocument, type DocMatterData } from "../src/lib/document-templates.ts";

test("resolveSellerAndBuyer picks distinct seller/buyer when explicit roles exist", () => {
  const clients = [
    { id: "1", role: "SELLER", name: "Alice" },
    { id: "2", role: "BUYER", name: "Bob" },
  ];
  const { seller, buyer } = resolveSellerAndBuyer(clients);
  assert.equal(seller?.name, "Alice");
  assert.equal(buyer?.name, "Bob");
});

test("resolveSellerAndBuyer never resolves seller and buyer to the same party (regression)", () => {
  // Bond Registration matters have a buyer + a bank, no seller — this used to make both
  // "seller" and "buyer" fall back to the same client.
  const clients = [
    { id: "1", role: "BUYER", name: "Rutendo & Farai" },
    { id: "2", role: "BANK", name: "CBZ Bank" },
  ];
  const { seller, buyer } = resolveSellerAndBuyer(clients);
  assert.notEqual(seller?.id, buyer?.id, "seller and buyer must never be the same party");
  assert.equal(buyer?.name, "Rutendo & Farai");
  assert.equal(seller?.name, "CBZ Bank");
});

test("resolveSellerAndBuyer handles a single-party matter without throwing", () => {
  const clients = [{ id: "1", role: "BUYER", name: "Solo Buyer" }];
  const { seller, buyer } = resolveSellerAndBuyer(clients);
  assert.equal(buyer?.name, "Solo Buyer");
  assert.equal(seller?.name, "Solo Buyer");
});

function sampleMatter(): DocMatterData {
  return {
    reference: "D360/2026/999",
    type: "SALE",
    priceCents: 10_000_000,
    openedDate: "2026-01-01T00:00:00.000Z",
    responsibleName: "Test Practitioner",
    property: { standNo: "Stand 1", suburb: "Suburbia", city: "Harare", titleDeedNo: "DT 1/2026", surveyDiagram: "SG 1/2026", size: "1,000 m²" },
    seller: { name: "Seller Name", idNumber: "SELLER-ID", address: "Seller Address" },
    buyer: { name: "Buyer Name", idNumber: "BUYER-ID", address: "Buyer Address" },
  };
}

test("generateDocument includes seller and buyer names in the Agreement of Sale", () => {
  const { body } = generateDocument("aos", sampleMatter());
  assert.match(body, /Seller Name/);
  assert.match(body, /Buyer Name/);
});

test("generateDocument returns empty output for an unknown template id", () => {
  const { title, body } = generateDocument("not-a-real-template", sampleMatter());
  assert.equal(title, "");
  assert.equal(body, "");
});
