import { chromium } from "playwright";

const [path, x0, y0, x1, y1, outfile] = process.argv.slice(2);
const port = process.env.PORT ?? "3419";

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 900 } });
await page.goto(`http://localhost:${port}${path}`, { waitUntil: "networkidle" });
await page.screenshot({
  path: outfile,
  clip: { x: Number(x0), y: Number(y0), width: Number(x1) - Number(x0), height: Number(y1) - Number(y0) },
});
await browser.close();
console.log(`Saved ${outfile}`);
