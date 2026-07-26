import { chromium } from "playwright";
const [path, outfile, width, height] = process.argv.slice(2);
const port = process.env.PORT ?? "3421";
const browser = await chromium.launch();
const page = await browser.newPage({
  viewport: { width: Number(width) || 1440, height: Number(height) || 900 },
});
await page.goto(`http://localhost:${port}${path}`, { waitUntil: "networkidle" });
await page.screenshot({ path: outfile, fullPage: true });
await browser.close();
console.log(`Saved ${outfile}`);
