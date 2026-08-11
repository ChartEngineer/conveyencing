import assert from "node:assert/strict";
import test from "node:test";
import { ZIMBABWE_IP_SOURCES, zimbabweIpSystemPrompt } from "../src/lib/zimbabwe-ip-research.ts";

test("Zimbabwe IP research mode has a curated statutory source for each core IP right", () => {
  const titles = ZIMBABWE_IP_SOURCES.map((source) => source.title).join("\n");

  assert.match(titles, /Industrial Designs Act \[Chapter 26:02\]/);
  assert.match(titles, /Patents Act \[Chapter 26:03\]/);
  assert.match(titles, /Trade Marks Act \[Chapter 26:04\]/);
  assert.match(titles, /Copyright and Neighbouring Rights Act \[Chapter 26:05\]/);
  assert.match(titles, /Geographical Indications Act \[Chapter 26:06\]/);
  assert.match(titles, /Integrated Circuit Layout-Designs Act \[Chapter 26:07\]/);
  assert.match(titles, /Intellectual Property Tribunal Act \[Chapter 26:08\]/);
});

test("Zimbabwe IP research prompt requires source checks and practitioner review", () => {
  const prompt = zimbabweIpSystemPrompt();

  assert.match(prompt, /Never invent a statute, section number/);
  assert.match(prompt, /Research required/);
  assert.match(prompt, /registered Zimbabwean legal practitioner/);
});
