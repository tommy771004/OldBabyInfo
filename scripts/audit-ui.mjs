/**
 * Measured UI audit — the checks a green typecheck/lint/test run cannot make.
 *
 * CLAUDE.md's rule is that a green pipeline is not "done": a UI change has to
 * be looked at in a browser, and contrast has to be computed rather than
 * eyeballed (ADR-0008). Some of "looked at" is mechanical, and this is that
 * part — the failures below are ones that are genuinely hard to see and easy
 * to ship:
 *
 *   - a label that is not actually centred in its control
 *   - a tap target too small for a thumb
 *   - a page that scrolls sideways at 390px
 *   - parallel columns that do not land on one grid
 *   - text with no gutter from the viewport edge
 *
 * Needs `npm run dev` (or `next start`) running. `PORT` overrides 3000.
 *
 * Usage: node scripts/audit-ui.mjs
 */
import { chromium } from "playwright";
const base = `http://localhost:${process.env.PORT ?? "3000"}`;
const browser = await chromium.launch();
const bad = [], ok = [];
const check = (n, c, d = "") => (c ? ok : bad).push(`${n}${d ? " — " + d : ""}`);

const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });

// ── Centering: is what should be centred actually centred (M3 targets)?
await page.goto(`${base}/zh-TW/parts`, { waitUntil: "networkidle" });
const centring = await page.evaluate(() => {
  const out = [];
  for (const el of document.querySelectorAll(".m3-chip, .m3-button, .m3-tab, .m3-icon-button")) {
    const box = el.getBoundingClientRect();
    // Optical centre of the text run vs the box centre.
    const r = document.createRange();
    let text = null;
    for (const n of el.childNodes) if (n.nodeType === 3 && n.textContent.trim()) { text = n; break; }
    if (!text) continue;
    r.selectNodeContents(text);
    const t = r.getBoundingClientRect();
    out.push({ cls: el.className.split(" ")[0], dy: +( (t.top + t.bottom) / 2 - (box.top + box.bottom) / 2 ).toFixed(2) });
  }
  return out;
});
const worstDy = Math.max(...centring.map(c => Math.abs(c.dy)));
check("M3 control labels are vertically centred (<=1.5px)", worstDy <= 1.5, `worst ${worstDy}px`);

// ── Touch targets: M3 asks 48dp; nothing interactive should be under 40.
for (const [route, width] of [["/zh-TW/parts", 390], ["/zh-TW/events", 390], ["/zh-TW/combo", 390]]) {
  const p = await browser.newPage({ viewport: { width, height: 844 }, isMobile: true, hasTouch: true });
  await p.goto(`${base}${route}`, { waitUntil: "load", timeout: 60000 });
  await p.waitForTimeout(500);
  const small = await p.evaluate(() => {
    const out = [];
    for (const el of document.querySelectorAll("a, button, select, summary, input")) {
      const b = el.getBoundingClientRect();
      if (b.width === 0 || b.height === 0) continue;
      if (getComputedStyle(el).display === "inline") continue; // inline text links
      if (b.height < 32) out.push({ tag: el.tagName, cls: (el.className || "").toString().slice(0, 34), h: Math.round(b.height) });
    }
    return out;
  });
  check(`touch targets >= 32px on ${route}`, small.length === 0, JSON.stringify(small.slice(0, 4)));
  await p.close();
}

// ── Horizontal overflow: the page body must never scroll sideways.
for (const [route, width] of [["/zh-TW", 390], ["/zh-TW/parts", 390], ["/zh-TW/events", 390], ["/zh-TW/combo", 390], ["/zh-TW/parts/dran-sword", 390], ["/zh-TW/parts/compare", 390], ["/zh-TW", 1440], ["/zh-TW/parts", 1440]]) {
  const p = await browser.newPage({ viewport: { width, height: 900 } });
  await p.goto(`${base}${route}`, { waitUntil: "load", timeout: 60000 });
  await p.waitForTimeout(500);
  const over = await p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  check(`no page-level horizontal overflow ${route}@${width}`, over <= 0, `${over}px`);
  await p.close();
}

// ── Parallel columns land on one grid (the ragged-comparison tell).
await page.goto(`${base}/zh-TW/combo`, { waitUntil: "networkidle" });
const slots = await page.evaluate(() => [...document.querySelectorAll('[class*="builder"] > div')]
  .map(d => ({ top: Math.round(d.getBoundingClientRect().top), h: Math.round(d.getBoundingClientRect().height) })));
check("combo slots share a top edge", new Set(slots.map(s => s.top)).size === 1, JSON.stringify(slots));

await page.goto(`${base}/zh-TW`, { waitUntil: "networkidle" });
const tools = await page.evaluate(() => [...document.querySelectorAll('[class*="toolCardItem"] > a')]
  .map(d => { const b = d.getBoundingClientRect(); return { top: Math.round(b.top), h: Math.round(b.height) }; }));
check("tool cards share a top edge and height",
  new Set(tools.map(t => t.top)).size === 1 && new Set(tools.map(t => t.h)).size === 1, JSON.stringify(tools));

// ── Text never touches the viewport edge on a phone.
const p2 = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true });
for (const route of ["/zh-TW/parts", "/zh-TW/events", "/zh-TW/parts/dran-sword", "/zh-TW/terms"]) {
  await p2.goto(`${base}${route}`, { waitUntil: "load", timeout: 60000 });
  await p2.waitForTimeout(500);
  const flush = await p2.evaluate(() => {
    const out = [];
    for (const el of document.querySelectorAll("h1, h2, h3, p, li, td, dd, dt")) {
      if (!el.textContent.trim()) continue;
      const b = el.getBoundingClientRect();
      if (b.width === 0) continue;
      if (b.left < 8 || b.right > window.innerWidth - 8) out.push({ tag: el.tagName, l: Math.round(b.left), r: Math.round(b.right), t: el.textContent.trim().slice(0, 18) });
    }
    return out.slice(0, 4);
  });
  check(`text keeps a gutter on ${route}`, flush.length === 0, JSON.stringify(flush));
}
await p2.close();

console.log("PASS:"); for (const o of ok) console.log("  ✓", o);
if (bad.length) { console.log("FAIL:"); for (const b of bad) console.log("  ✗", b); }
await browser.close();
process.exit(bad.length ? 1 : 0);
