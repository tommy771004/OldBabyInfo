import { chromium } from "playwright";

const port = process.env.PORT ?? "3417";
const browser = await chromium.launch();
const page = await browser.newPage();

const fontRequests = [];
page.on("response", async (res) => {
  const url = res.url();
  if (url.endsWith(".woff2") || url.endsWith(".woff") || url.endsWith(".ttf")) {
    const headers = res.headers();
    fontRequests.push({
      url: url.split("/").pop(),
      size: Number(headers["content-length"] ?? 0),
    });
  }
});

await page.goto(`http://localhost:${port}/`, { waitUntil: "networkidle" });
await page.evaluate(() => document.fonts.ready);

const h1Font = await page.evaluate(() => {
  const h1 = document.querySelector("h1");
  return h1 ? getComputedStyle(h1).fontFamily : "NO H1";
});
const bodyFont = await page.evaluate(() => getComputedStyle(document.body).fontFamily);

console.log("h1 font-family:", h1Font);
console.log("body font-family:", bodyFont);
console.log("\nFont network requests on first load:");
let total = 0;
for (const f of fontRequests) {
  console.log(`  ${f.url}: ${(f.size / 1024).toFixed(1)} KB`);
  total += f.size;
}
console.log(`\nTotal font transfer: ${(total / 1024).toFixed(1)} KB across ${fontRequests.length} files`);

// CLS check: layout shifts after initial paint (font swap should be ~0)
const cls = await page.evaluate(
  () =>
    new Promise((resolve) => {
      let total = 0;
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (!entry.hadRecentInput) total += entry.value;
        }
      }).observe({ type: "layout-shift", buffered: true });
      setTimeout(() => resolve(total), 500);
    }),
);
console.log(`\nCumulative Layout Shift (post-paint): ${cls.toFixed(4)}`);

await browser.close();
