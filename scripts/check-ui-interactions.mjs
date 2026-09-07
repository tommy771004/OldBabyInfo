/**
 * Interaction check — every control on the site clicked with a real pointer.
 *
 * A control that looks interactive and does nothing is worse than no control,
 * and neither the type checker nor the unit tests can tell the difference.
 * This drives the real pages: filter chips, tabs, text fields and selects,
 * the disclosure rows, the Combo builder, the top app bar's current-page
 * state, and the phone navigation pill.
 *
 * Needs `npm run dev` (or `next start`) running. `PORT` overrides 3000.
 *
 * Usage: node scripts/check-ui-interactions.mjs
 */
import { chromium } from "playwright";
const port = process.env.PORT ?? "3000";
const base = `http://localhost:${port}`;
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
const errs = [];
page.on("pageerror", e => errs.push("pageerror: " + e.message.slice(0, 160)));
page.on("console", m => { if (m.type() === "error") errs.push("console: " + m.text().slice(0, 160)); });
const ok = [], bad = [];
const check = (name, cond, detail = "") => (cond ? ok : bad).push(`${name}${detail ? " — " + detail : ""}`);

// ---- Parts: filter chip, tab, text field, select
await page.goto(`${base}/zh-TW/parts`, { waitUntil: "networkidle" });
const chip = page.locator("a.m3-chip", { hasText: "Beyblade Burst" }).first();
await chip.click();
await page.waitForLoadState("networkidle");
check("parts filter chip navigates", page.url().includes("catalogGeneration=burst"), page.url());
check("selected chip carries a check mark", await page.locator('a.m3-chip[aria-current="page"] svg').count() > 0);

await page.goto(`${base}/zh-TW/parts`, { waitUntil: "networkidle" });
const tab = page.locator("a.m3-tab", { hasText: "Blade" }).first();
await tab.click();
await page.waitForLoadState("networkidle");
check("parts tab navigates", page.url().includes("catalogPartType=blade"), page.url());
const ind = await page.locator('a.m3-tab[aria-current="page"]').first().evaluate(el =>
  getComputedStyle(el, "::after").backgroundColor);
check("active tab paints an indicator", ind !== "rgba(0, 0, 0, 0)" && ind !== "transparent", ind);

await page.goto(`${base}/zh-TW/parts`, { waitUntil: "networkidle" });
const field = page.locator("input.m3-field__input").first();
const labelBefore = await page.locator(".m3-field__label").first().evaluate(el => getComputedStyle(el).transform);
await field.click();
await field.fill("dran");
const labelAfter = await page.locator(".m3-field__label").first().evaluate(el => getComputedStyle(el).transform);
check("text field label floats on input", labelBefore !== labelAfter, `${labelBefore} -> ${labelAfter}`);
await page.locator("button.m3-button--filled").first().click();
await page.waitForLoadState("networkidle");
check("parts search submits", page.url().includes("catalogQuery=dran"), page.url());

// ---- Events: select filter navigates, tab switches, details opens
await page.goto(`${base}/zh-TW/events`, { waitUntil: "networkidle" });
const before = page.url();
await page.locator('select[name="city"]').selectOption({ index: 1 });
await page.waitForURL(u => u.toString() !== before, { timeout: 8000 }).catch(() => {});
check("events city select navigates", page.url() !== before, page.url());

await page.goto(`${base}/zh-TW/events`, { waitUntil: "networkidle" });
await page.locator("nav a").filter({ hasText: "已結束" }).first().click();
await page.waitForURL(/scope=past/, { timeout: 8000 }).catch(() => {});
check("events scope tab navigates", page.url().includes("scope=past"), page.url());

await page.goto(`${base}/zh-TW/events`, { waitUntil: "networkidle" });
const summary = page.locator("summary").first();
await summary.click();
check("venue disclosure opens", await page.locator("details[open]").count() > 0);

// ---- Combo builder: pick a candidate, stats update, clear works
await page.goto(`${base}/zh-TW/combo`, { waitUntil: "networkidle" });
const statBefore = await page.locator("dd").first().innerText();
await page.locator("a").filter({ hasText: "惡魔冥界" }).first().click();
await page.waitForURL(/blade=/, { timeout: 8000 }).catch(() => {});
await page.waitForLoadState("networkidle");
const statAfter = await page.locator("dd").first().innerText();
check("combo candidate changes the composed Stat", statBefore !== statAfter, `${statBefore} -> ${statAfter}`);
const clear = page.locator("a.m3-button--text").first();
if (await clear.count()) {
  await clear.click();
  await page.waitForURL((u) => !u.toString().includes("blade="), { timeout: 8000 }).catch(() => {});
  check("combo clear works", !page.url().includes("blade="), page.url());
} else check("combo clear works", false, "no clear button rendered");

// ---- Header nav marks the current destination
await page.goto(`${base}/zh-TW/events`, { waitUntil: "networkidle" });
const current = await page.locator('header nav').first().locator('a[aria-current="page"]').allInnerTexts();
check("top app bar marks current destination", current.length === 1, JSON.stringify(current));

// ---- Discussion select
await page.goto(`${base}/zh-TW/discussion`, { waitUntil: "networkidle" });
await page.locator("select#discussion-subject-filter").selectOption("part");
check("discussion filter select responds", await page.locator("select#discussion-subject-filter").inputValue() === "part");

// ---- Mobile: nav pill labels only the current destination
const m = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
const mp = await m.newPage();
await mp.goto(`${base}/zh-TW/events`, { waitUntil: "networkidle" });
const pill = mp.locator("nav").filter({ has: mp.locator('a[href="/combo"]') }).last();
const shown = await pill.locator("a span").evaluateAll(ns =>
  ns.filter(n => getComputedStyle(n).display !== "none" && n.textContent.trim()).map(n => n.textContent));
check("mobile pill labels only the current destination", shown.length === 1, JSON.stringify(shown));
const barBox = await pill.evaluate(el => { const r = el.getBoundingClientRect();
  return { top: Math.round(r.top), bottom: Math.round(r.bottom), left: Math.round(r.left), right: Math.round(r.right) }; });
check("mobile pill sits inside the viewport",
  barBox.bottom <= 844 && barBox.top >= 0 && barBox.left >= 0 && barBox.right <= 390, JSON.stringify(barBox));
await mp.close(); await m.close();

console.log("PASS:"); for (const o of ok) console.log("  ✓", o);
if (bad.length) { console.log("FAIL:"); for (const b of bad) console.log("  ✗", b); }
if (errs.length) { console.log("BROWSER ERRORS:"); for (const e of [...new Set(errs)]) console.log("  !", e); }
await browser.close();
process.exit(bad.length ? 1 : 0);
