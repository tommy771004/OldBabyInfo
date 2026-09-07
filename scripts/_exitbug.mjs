import { chromium } from "playwright";

const port = process.env.PORT ?? "3000";
const browser = await chromium.launch();

// Precise question: is anything DIMMED while it still has pixels visible
// BELOW the sticky bar? Area hidden behind the glass does not count -- the
// reader cannot see it either way. Area below the bar is real content.
for (const path of ["/events", "/terms", "/mold-batches", "/meta"]) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto(`http://localhost:${port}${path}`, { waitUntil: "networkidle", timeout: 60000 });
  await page.waitForTimeout(500);
  const total = await page.evaluate(() => document.documentElement.scrollHeight);

  const hits = [];
  for (let y = 0; y < Math.min(total, 6000); y += 100) {
    await page.evaluate((yy) => window.scrollTo(0, yy), y);
    await page.waitForTimeout(90);
    const bad = await page.evaluate(() => {
      const hb = document.querySelector("header").getBoundingClientRect().bottom;
      const out = [];
      for (const el of document.querySelectorAll("main > *")) {
        const r = el.getBoundingClientRect();
        if (r.height === 0) continue;
        const visibleBelowBar = Math.min(r.bottom, window.innerHeight) - Math.max(r.top, hb);
        if (visibleBelowBar < 12) continue;
        const op = Number.parseFloat(getComputedStyle(el).opacity);
        if (op < 0.95) out.push({ tag: el.tagName, px: Math.round(visibleBelowBar), op: op.toFixed(3) });
      }
      return out;
    });
    for (const b of bad) hits.push({ y, ...b });
  }
  await page.close();

  console.log(`${path}: ${hits.length} dimmed-while-visible samples`);
  for (const h of hits.slice(0, 6)) {
    console.log(`   y=${String(h.y).padEnd(5)} ${h.tag.padEnd(6)} ${h.px}px visible below the bar at opacity ${h.op}`);
  }
  if (hits.length > 6) console.log(`   ... and ${hits.length - 6} more`);
}
await browser.close();
