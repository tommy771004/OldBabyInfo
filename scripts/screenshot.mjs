/**
 * Visual verification helper — the Chrome extension isn't connected in this
 * environment, so this is the fallback for actually SEEING a page instead
 * of trusting a green build. Requires `npx next start` running separately.
 *
 * Usage: node scripts/screenshot.mjs <path> [outfile]
 *   node scripts/screenshot.mjs /color-demo
 *   node scripts/screenshot.mjs /en/parts parts-en.png
 */
import { chromium } from "playwright";

const path = process.argv[2];
if (!path) {
  console.error("Usage: node scripts/screenshot.mjs <path> [outfile]");
  process.exit(1);
}
const outfile = process.argv[3] ?? `screenshot-${path.replace(/\//g, "_") || "root"}.png`;
const port = process.env.PORT ?? "3416";

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 2200 } });
await page.goto(`http://localhost:${port}${path}`, { waitUntil: "networkidle" });
await page.screenshot({ path: outfile, fullPage: true });
await browser.close();
console.log(`Saved ${outfile}`);
