const { chromium } = require("playwright-core");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");

async function main() {
  const browser = await chromium.launch({ channel: "msedge", headless: true });
  const errors = [];

  const testFile = path.join(__dirname, "test-upload.txt");
  fs.writeFileSync(testFile, "Sample uploaded document content for smoke test.");

  async function newPage() {
    const page = await browser.newPage();
    page.on("console", (msg) => {
      if (msg.type() === "error") errors.push(msg.text());
    });
    page.on("pageerror", (err) => errors.push(String(err)));
    return page;
  }

  const shot = (page, name) => page.screenshot({ path: path.join(__dirname, "..", "screenshots", name), fullPage: true });

  // --- Partner session: dashboard, matters, matter detail, messages, file upload, documents ---
  const page = await newPage();
  await page.goto("http://localhost:3000/login", { waitUntil: "networkidle" });
  await page.fill('input[name="email"]', "partner@deeds360.co.zw");
  await page.fill('input[name="password"]', "password123");
  await page.click('button[type="submit"]');
  await page.waitForURL("**/dashboard", { timeout: 15000 });
  await page.waitForLoadState("networkidle");
  await shot(page, "02-dashboard.png");

  await page.click('a[href="/matters"]');
  await page.waitForURL("**/matters");
  await page.waitForLoadState("networkidle");

  const firstMatterLink = page.locator('table a[href^="/matters/"]').first();
  await firstMatterLink.click();
  await page.waitForURL(/\/matters\/.+/);
  await page.waitForLoadState("networkidle");
  await shot(page, "04-matter-detail.png");

  // Upload a file against the first checklist item
  const fileInput = page.locator('input[type="file"]').first();
  await fileInput.setInputFiles(testFile);
  const uploadForm = fileInput.locator("xpath=ancestor::form[1]");
  await uploadForm.locator('button[type="submit"]').click();
  await page.waitForLoadState("networkidle");
  await shot(page, "07-matter-after-upload.png");

  // Send a message
  const messageText = "Hello, please confirm receipt of the latest documents.";
  const messageInput = page.getByPlaceholder("Write a message...");
  await messageInput.scrollIntoViewIfNeeded();
  await messageInput.fill(messageText);
  await page.getByRole("button", { name: "Send" }).click({ force: true });
  await page.getByText(messageText).waitFor({ timeout: 15000 });
  await page.waitForLoadState("networkidle");
  await shot(page, "08-matter-after-message.png");

  await page.close();

  // --- Admin session: Users page, create staff account ---
  const adminPage = await newPage();
  await adminPage.goto("http://localhost:3000/login", { waitUntil: "networkidle" });
  await adminPage.fill('input[name="email"]', "admin@deeds360.co.zw");
  await adminPage.fill('input[name="password"]', "password123");
  await adminPage.click('button[type="submit"]');
  await adminPage.waitForURL("**/dashboard", { timeout: 15000 });
  await adminPage.click('a[href="/users"]');
  await adminPage.waitForURL("**/users");
  await adminPage.waitForLoadState("networkidle");
  await shot(adminPage, "09-users-before.png");

  const uniqueEmail = `newstaff-${crypto.randomUUID().slice(0, 8)}@deeds360.co.zw`;
  await adminPage.fill("#name", "Test Newstaff");
  await adminPage.fill("#email", uniqueEmail);
  await adminPage.selectOption("#role", "CLERK");
  await adminPage.fill("#password", "temporarypass123");
  await adminPage.click('button[type="submit"]:has-text("Create Account")');
  await adminPage.waitForURL("**/users");
  await adminPage.waitForLoadState("networkidle");
  await shot(adminPage, "10-users-after.png");

  // --- Client portal session ---
  const clientPage = await newPage();
  await clientPage.goto("http://localhost:3000/login", { waitUntil: "networkidle" });
  await clientPage.fill('input[name="email"]', "client@deeds360.co.zw");
  await clientPage.fill('input[name="password"]', "password123");
  await clientPage.click('button[type="submit"]');
  await clientPage.waitForURL("**/portal", { timeout: 15000 });
  await clientPage.waitForLoadState("networkidle");
  await shot(clientPage, "11-client-portal.png");

  // --- Financials: record a trust transaction, then verify the negative-balance guard ---
  const financePage = await newPage();
  await financePage.goto("http://localhost:3000/login", { waitUntil: "networkidle" });
  await financePage.fill('input[name="email"]', "accounts@deeds360.co.zw");
  await financePage.fill('input[name="password"]', "password123");
  await financePage.click('button[type="submit"]');
  await financePage.waitForURL("**/dashboard", { timeout: 15000 });
  await financePage.goto("http://localhost:3000/financials", { waitUntil: "networkidle" });

  const trustForm = financePage.locator("form").filter({ has: financePage.getByLabel("Description") });
  const matterRef = await trustForm.locator("#matterId").locator("option").first().textContent();
  await trustForm.locator("#type").selectOption("DEPOSIT");
  await trustForm.locator("#amount").fill("500");
  await trustForm.locator("#description").fill("Smoke-test deposit");
  await trustForm.locator('button[type="submit"]').click({ force: true });
  await financePage.getByText("Smoke-test deposit").waitFor({ timeout: 15000 });
  await shot(financePage, "14-trust-deposit-recorded.png");
  console.log(`Recorded trust deposit for ${matterRef?.trim()}`);

  // Attempt a payment out far larger than any matter's balance — must be rejected, not silently applied.
  await trustForm.locator("#type").selectOption("PAYMENT_OUT");
  await trustForm.locator("#amount").fill("99999999");
  await trustForm.locator("#description").fill("Should be rejected");
  await trustForm.locator('button[type="submit"]').click({ force: true });
  await financePage.getByText(/would take the trust balance/).waitFor({ timeout: 15000 });
  await shot(financePage, "15-trust-negative-balance-rejected.png");
  const rejectedText = await financePage.locator("body").innerText();
  if (rejectedText.includes("Should be rejected")) {
    throw new Error("SECURITY REGRESSION: an oversized payment-out was recorded instead of rejected.");
  }
  console.log("Negative trust balance correctly rejected.");

  // --- Clerk session: restricted role — verify direct-URL bypass is blocked and PII/price are redacted ---
  const clerkPage = await newPage();
  await clerkPage.goto("http://localhost:3000/login", { waitUntil: "networkidle" });
  await clerkPage.fill('input[name="email"]', "clerk@deeds360.co.zw");
  await clerkPage.fill('input[name="password"]', "password123");
  await clerkPage.click('button[type="submit"]');
  await clerkPage.waitForURL("**/dashboard", { timeout: 15000 });

  // Direct URL access to a page not in Clerk's nav should redirect away, not render.
  await clerkPage.goto("http://localhost:3000/financials", { waitUntil: "networkidle" });
  const financialsUrl = clerkPage.url();
  console.log("Clerk visiting /financials landed on:", financialsUrl);
  if (financialsUrl.includes("/financials")) {
    throw new Error("SECURITY REGRESSION: Clerk role was able to load /financials directly.");
  }

  await clerkPage.goto("http://localhost:3000/clients", { waitUntil: "networkidle" });
  const clientsUrl = clerkPage.url();
  console.log("Clerk visiting /clients landed on:", clientsUrl);
  if (clientsUrl.includes("/clients")) {
    throw new Error("SECURITY REGRESSION: Clerk role was able to load /clients directly.");
  }

  // Matters list should redact price for Clerk.
  await clerkPage.goto("http://localhost:3000/matters", { waitUntil: "networkidle" });
  await shot(clerkPage, "12-clerk-matters-list.png");
  const bodyText = await clerkPage.locator("body").innerText();
  if (!bodyText.includes("Restricted")) {
    throw new Error("Expected Clerk's Matters list to show 'Restricted' for price, but it did not.");
  }

  // Matter detail should hide client ID numbers and property valuation for Clerk.
  const clerkFirstMatterLink = clerkPage.locator('table a[href^="/matters/"]').first();
  await clerkFirstMatterLink.click();
  await clerkPage.waitForURL(/\/matters\/.+/);
  await clerkPage.waitForLoadState("networkidle");
  await shot(clerkPage, "13-clerk-matter-detail.png");
  const detailText = await clerkPage.locator("body").innerText();
  if (detailText.includes("Valuation:")) {
    throw new Error("SECURITY REGRESSION: Clerk can see property valuation on matter detail.");
  }

  await browser.close();
  fs.unlinkSync(testFile);

  console.log("SMOKE TEST OK");
  if (errors.length) {
    console.log("CONSOLE ERRORS:");
    errors.forEach((e) => console.log(" - " + e));
  } else {
    console.log("No console errors.");
  }
}

main().catch((err) => {
  console.error("SMOKE TEST FAILED:", err);
  process.exit(1);
});
