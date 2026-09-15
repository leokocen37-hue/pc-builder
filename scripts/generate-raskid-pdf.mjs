// Regenerates public/obrazac-za-jednostrani-raskid.pdf from the live page at
// /uvjeti/obrazac-za-jednostrani-raskid, so the downloadable PDF and the HTML
// version can never drift apart — the page's own @media print rules are what
// shape the sheet.
//
// Run it whenever the form text or the company details in lib/company.ts
// change:
//
//   npm run build && npm start        (in one terminal)
//   node scripts/generate-raskid-pdf.mjs
//
// The generated PDF is committed to the repo: Vercel builds don't have a
// Chromium available, so this is a maintenance step rather than a build step.
import { chromium } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import path from "node:path";

const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const ROUTE = "/uvjeti/obrazac-za-jednostrani-raskid";
const OUT = path.join(process.cwd(), "public", "obrazac-za-jednostrani-raskid.pdf");

const browser = await chromium.launch();
try {
  const page = await browser.newPage();
  const res = await page.goto(BASE + ROUTE, { waitUntil: "networkidle" });
  if (!res || !res.ok()) {
    throw new Error(`${BASE + ROUTE} returned ${res ? res.status() : "no response"} — is the server running?`);
  }

  // the cookie banner is fixed-position and would otherwise be captured
  const accept = page.getByText("Prihvaćam");
  if (await accept.isVisible().catch(() => false)) await accept.click();

  await page.emulateMedia({ media: "print" });
  await mkdir(path.dirname(OUT), { recursive: true });
  await page.pdf({
    path: OUT,
    format: "A4",
    printBackground: false,
    margin: { top: "18mm", right: "16mm", bottom: "18mm", left: "16mm" },
  });
  console.log("wrote", path.relative(process.cwd(), OUT));
} finally {
  await browser.close();
}
