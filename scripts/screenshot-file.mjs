import { chromium } from "playwright";
import { pathToFileURL } from "node:url";
import { resolve } from "node:path";

const filePath = process.argv[2];
const outfile = process.argv[3];
if (!filePath || !outfile) {
  console.error("Usage: node scripts/screenshot-file.mjs <local-html-path> <outfile>");
  process.exit(1);
}

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 900 } });
await page.goto(pathToFileURL(resolve(filePath)).href, { waitUntil: "networkidle" });
await page.evaluate(() => document.fonts.ready);
await page.screenshot({ path: outfile, fullPage: true });
await browser.close();
console.log(`Saved ${outfile}`);
