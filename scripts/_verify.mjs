import { chromium } from "playwright";

const port = process.env.PORT ?? "3000";
const outDir = process.argv[2];
const browser = await chromium.launch();

async function contentHeight(path) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 400 } });
  await page.goto(`http://localhost:${port}${path}`, { waitUntil: "networkidle", timeout: 60000 });
  await page.waitForTimeout(400);
  const h = await page.evaluate(() => document.documentElement.scrollHeight);
  await page.close();
  return h;
}

/**
 * The real trap: a page that scrolls by only a few dozen pixels. Its last
 * element enters the view() range and can never advance far enough to reach
 * the `to` keyframe, so it would sit part-faded with no way for the reader
 * to finish it. A screenshot does not catch this reliably -- a 0.6-opacity
 * paragraph still looks like text -- so measure the computed opacity.
 */
async function stranded(path, w, h) {
  const page = await browser.newPage({ viewport: { width: w, height: h } });
  await page.goto(`http://localhost:${port}${path}`, { waitUntil: "networkidle", timeout: 60000 });
  await page.waitForTimeout(500);
  const overflow = await page.evaluate(
    () => document.documentElement.scrollHeight - window.innerHeight,
  );
  const found = [];
  for (const [label, y] of [["top", 0], ["bottom", 1e7]]) {
    await page.evaluate((yy) => window.scrollTo(0, yy), y);
    await page.waitForTimeout(700);
    const bad = await page.evaluate(() => {
      const header = document.querySelector("header");
      const hb = header ? header.getBoundingClientRect().bottom : 0;
      const out = [];
      for (const el of document.querySelectorAll("main > *, main > * > section")) {
        const r = el.getBoundingClientRect();
        if (r.height === 0) continue;
        // Judge only what sits comfortably inside the viewport. Something
        // genuinely leaving the top edge is SUPPOSED to be fading.
        if (r.top < hb + 8 || r.bottom > window.innerHeight - 8) continue;
        const op = Number.parseFloat(getComputedStyle(el).opacity);
        if (op < 0.95) out.push(`${el.tagName}@${op.toFixed(2)}`);
      }
      return out;
    });
    if (bad.length) found.push(`${label}:${bad.join(",")}`);
  }
  await page.close();
  return { overflow, found };
}

let failures = 0;
for (const path of ["/guides", "/terms", "/parts", "/events", "/meta"]) {
  const ch = await contentHeight(path);
  // Heights chosen to leave the page overflowing by only a sliver.
  const heights = [ch - 20, ch - 60, ch - 140, ch - 400].filter((h) => h >= 400 && h <= 2200);
  if (!heights.length) heights.push(800);
  for (const h of heights) {
    const { overflow, found } = await stranded(path, 1440, Math.round(h));
    if (found.length) failures++;
    console.log(
      `${path.padEnd(9)} 1440x${String(Math.round(h)).padEnd(5)} overflow=${String(overflow).padEnd(5)} ${found.length ? "STRANDED " + found.join(" | ") : "ok"}`,
    );
  }
}
console.log(failures ? `\nFAILURES: ${failures}` : "\nno stranded content at any tested height");
await browser.close();
