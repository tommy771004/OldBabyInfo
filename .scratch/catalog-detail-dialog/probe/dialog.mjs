import { chromium } from "playwright";
const base = `http://localhost:${process.env.PORT ?? "3210"}`;
const out = process.env.OUT;
const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36";
const browser = await chromium.launch();
const log = (...a) => console.log(...a);

for (const [w, h, mobile] of [[1440, 1000, false], [390, 844, true]]) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, isMobile: mobile, hasTouch: mobile, locale: "zh-TW", userAgent: UA });
  const p = await ctx.newPage();
  const errors = [];
  p.on("console", m => { if (m.type() === "error") errors.push(m.text().slice(0, 200)); });
  p.on("pageerror", e => errors.push("pageerror: " + e.message.slice(0, 200)));

  await p.goto(`${base}/parts`, { waitUntil: "networkidle", timeout: 120000 });
  await p.evaluate(() => window.scrollTo(0, 400));
  const scrollBefore = await p.evaluate(() => window.scrollY);
  // 1. Part row → dialog
  await p.getByRole("link", { name: "A 加速" }).first().click();
  await p.waitForSelector("dialog[open]", { timeout: 30000 });
  await p.waitForTimeout(600);
  log(`[${w}] after click url=${new URL(p.url()).pathname} dialogOpen=${await p.locator("dialog[open]").count()}`);
  log(`[${w}] focused=${await p.evaluate(() => document.activeElement?.getAttribute("aria-label") ?? document.activeElement?.tagName)}`);
  log(`[${w}] bodyOverflow=${await p.evaluate(() => getComputedStyle(document.body).overflow)}`);
  await p.screenshot({ path: `${out}/dialog-part@${w}.png` });
  const card = await p.locator("dialog[open] > div").boundingBox();
  log(`[${w}] card box=${JSON.stringify(card)}`);
  // scroll inside dialog to bottom and shoot
  await p.evaluate(() => { const b = document.querySelector("dialog[open] > div > div:last-child"); b.scrollTop = b.scrollHeight; });
  await p.waitForTimeout(200);
  await p.screenshot({ path: `${out}/dialog-part-bottom@${w}.png` });
  // 2. Escape closes and returns
  await p.keyboard.press("Escape");
  await p.waitForTimeout(800);
  log(`[${w}] after Esc url=${new URL(p.url()).pathname} dialogs=${await p.locator("dialog").count()} scrollY=${await p.evaluate(() => window.scrollY)} (was ${scrollBefore}) focused=${await p.evaluate(() => document.activeElement?.textContent?.slice(0, 10))}`);
  // 3. Reopen, close via backdrop click
  await p.getByRole("link", { name: "B 球" }).first().click();
  await p.waitForSelector("dialog[open]", { timeout: 30000 });
  await p.waitForTimeout(300);
  if (!mobile) {
    await p.mouse.click(20, 500);
    await p.waitForTimeout(800);
    log(`[${w}] after backdrop click url=${new URL(p.url()).pathname} dialogs=${await p.locator("dialog").count()}`);
    await p.getByRole("link", { name: "B 球" }).first().click();
    await p.waitForSelector("dialog[open]", { timeout: 30000 });
    await p.waitForTimeout(300);
  }
  // 4. Close button
  await p.getByRole("button", { name: "關閉" }).click();
  await p.waitForTimeout(800);
  log(`[${w}] after ✕ url=${new URL(p.url()).pathname} dialogs=${await p.locator("dialog").count()}`);
  // 5. Beyblade tab → catalog dialog → composition link swaps → back
  await p.goto(`${base}/parts?catalogGeneration=x&catalogKind=beyblade`, { waitUntil: "networkidle", timeout: 120000 });
  await p.getByRole("link", { name: /蒼龍神劍 3-60 F 平坦/ }).first().click();
  await p.waitForSelector("dialog[open]", { timeout: 30000 });
  await p.waitForTimeout(600);
  log(`[${w}] catalog dialog url=${decodeURIComponent(new URL(p.url()).pathname)}`);
  await p.screenshot({ path: `${out}/dialog-catalog@${w}.png` });
  await p.locator("dialog[open]").getByRole("link", { name: "蒼龍神劍", exact: true }).first().click();
  await p.waitForTimeout(1500);
  log(`[${w}] after composition link url=${new URL(p.url()).pathname} dialogs=${await p.locator("dialog[open]").count()} heading=${await p.locator("dialog[open] h2").first().textContent()}`);
  await p.screenshot({ path: `${out}/dialog-swapped@${w}.png` });
  await p.goBack();
  await p.waitForTimeout(1000);
  log(`[${w}] after back url=${decodeURIComponent(new URL(p.url()).pathname)} dialogs=${await p.locator("dialog[open]").count()} heading=${await p.locator("dialog[open] h2").first().textContent().catch(() => "-")}`);
  await p.goBack();
  await p.waitForTimeout(1000);
  log(`[${w}] after back x2 url=${new URL(p.url()).pathname + new URL(p.url()).search} dialogs=${await p.locator("dialog").count()}`);
  // 6. Full page link does a real navigation
  await p.getByRole("link", { name: /蒼龍神劍 3-60 F 平坦/ }).first().click();
  await p.waitForSelector("dialog[open]", { timeout: 30000 });
  await p.getByRole("link", { name: /開啟完整頁面/ }).click();
  await p.waitForLoadState("load");
  await p.waitForTimeout(800);
  log(`[${w}] full page url=${decodeURIComponent(new URL(p.url()).pathname)} dialogs=${await p.locator("dialog").count()} h1=${await p.locator("main h1").first().textContent()}`);
  // 7. Hard load of a part URL is the full page
  await p.goto(`${base}/parts/dran-sword`, { waitUntil: "load" });
  log(`[${w}] hard load dialogs=${await p.locator("dialog").count()} h1=${await p.locator("main h1").first().textContent()}`);
  // 8. Nav link from an open dialog closes it
  await p.goto(`${base}/parts`, { waitUntil: "networkidle" });
  await p.getByRole("link", { name: "A 加速" }).first().click();
  await p.waitForSelector("dialog[open]", { timeout: 30000 });
  await p.getByRole("link", { name: /哪裡買/ }).click();
  await p.waitForTimeout(1500);
  log(`[${w}] where-to-buy url=${new URL(p.url()).pathname} dialogs=${await p.locator("dialog").count()}`);
  log(`[${w}] console errors: ${errors.length ? JSON.stringify(errors.slice(0, 5)) : "none"}`);
  await ctx.close();
}
await browser.close();
