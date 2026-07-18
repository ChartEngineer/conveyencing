const { chromium } = require("playwright-core");
const path = require("path");

const BASE_URL = process.argv[2] || "https://conveyancing-app.vercel.app";

async function main() {
  const browser = await chromium.launch({ channel: "msedge", headless: true });
  const page = await browser.newPage();
  const errors = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(msg.text());
  });
  page.on("pageerror", (err) => errors.push(String(err)));

  const shot = (name) => page.screenshot({ path: path.join(__dirname, "..", "screenshots", name), fullPage: true });

  console.log(`Testing ${BASE_URL} ...`);
  await page.goto(`${BASE_URL}/login`, { waitUntil: "networkidle", timeout: 30000 });
  await shot("prod-01-login.png");
  console.log("Login page loaded:", page.url());

  await page.fill('input[name="email"]', "partner@deeds360.co.zw");
  await page.fill('input[name="password"]', "password123");
  await page.click('button[type="submit"]');
  await page.waitForURL("**/dashboard", { timeout: 20000 });
  await page.waitForLoadState("networkidle");
  await shot("prod-02-dashboard.png");
  console.log("Logged in, dashboard loaded:", page.url());

  await page.click('a[href="/matters"]');
  await page.waitForURL("**/matters");
  await page.waitForLoadState("networkidle");
  await shot("prod-03-matters.png");

  const firstMatterLink = page.locator('table a[href^="/matters/"]').first();
  await firstMatterLink.click();
  await page.waitForURL(/\/matters\/.+/);
  await page.waitForLoadState("networkidle");
  await shot("prod-04-matter-detail.png");

  await browser.close();

  console.log("PROD SMOKE TEST OK");
  if (errors.length) {
    console.log("CONSOLE ERRORS:");
    errors.forEach((e) => console.log(" - " + e));
  } else {
    console.log("No console errors.");
  }
}

main().catch((err) => {
  console.error("PROD SMOKE TEST FAILED:", err);
  process.exit(1);
});
