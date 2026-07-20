const { chromium } = require("playwright-core");
const path = require("path");

const BASE_URL = "https://conveyancing-app.vercel.app";
const GOOD_IP = "216.198.79.131";

async function main() {
  const browser = await chromium.launch({
    channel: "msedge",
    headless: true,
    args: [`--host-resolver-rules=MAP conveyancing-app.vercel.app ${GOOD_IP}`],
  });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const errors = [];
  page.on("pageerror", (err) => errors.push(String(err)));

  await page.goto(`${BASE_URL}/login`, { waitUntil: "networkidle", timeout: 30000 });
  await page.screenshot({ path: path.join(__dirname, "..", "screenshots", "polish-01-login.png"), fullPage: true });

  // Tab to the email field and check the focus ring is visible
  await page.keyboard.press("Tab");
  await page.keyboard.press("Tab");
  await page.screenshot({ path: path.join(__dirname, "..", "screenshots", "polish-02-focus-ring.png") });

  await page.goto(`${BASE_URL}/this-page-does-not-exist`, { waitUntil: "networkidle", timeout: 30000 });
  await page.screenshot({ path: path.join(__dirname, "..", "screenshots", "polish-03-404.png"), fullPage: true });

  await browser.close();
  console.log("Errors:", errors.length ? errors : "none");
  console.log("DONE");
}

main().catch((err) => {
  console.error("FAILED:", err);
  process.exit(1);
});
