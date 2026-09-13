import { chromium } from "playwright";
import { evaluatePartDetailHtml } from "../../../src/lib/public-journey/html-contract.ts";
const base = "http://localhost:3210";
const out = process.env.OUT;
const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36";
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 1000 }, locale: "zh-TW", userAgent: UA });
const p = await ctx.newPage();
const errors = [];
p.on("pageerror", e => errors.push(e.message.slice(0, 200)));
// 1. scrolled swap inside the dialog
await p.goto(`${base}/parts?catalogGeneration=x&catalogKind=beyblade`, { waitUntil: "networkidle", timeout: 120000 });
await p.getByRole("link", { name: /蒼龍神劍 3-60 F 平坦/ }).first().click();
await p.waitForSelector("dialog[open]:not([aria-busy])", { timeout: 30000 });
await p.waitForTimeout(400);
const body = () => p.locator("dialog[open] > div > div").last();
await body().evaluate(el => { el.scrollTop = el.scrollHeight; });
await p.waitForTimeout(200);
console.log("scrolled body scrollTop before swap:", await body().evaluate(el => el.scrollTop));
await p.locator("dialog[open]").getByRole("link", { name: "DRANSWORD3-60F Red Ver." }).click();
await p.waitForFunction(() => document.querySelector("dialog[open] h2")?.textContent?.includes("Red Ver."), null, { timeout: 30000 });
await p.waitForTimeout(400);
console.log("after swap scrollTop:", await body().evaluate(el => el.scrollTop), "focused:", await p.evaluate(() => document.activeElement?.getAttribute("aria-label") ?? document.activeElement?.tagName));
await p.screenshot({ path: `${out}/swap-release@1440.png` });
// 2. hard-loaded catalog page: composition link opens dialog over the page
await p.goto(`${base}/parts/catalog/beybrew%3Aseries-bx01-dransword3-60f-ed0b62931c`, { waitUntil: "networkidle", timeout: 120000 });
await p.screenshot({ path: `${out}/full-catalog@1440.png`, fullPage: true });
await p.getByRole("link", { name: "蒼龍神劍", exact: true }).first().click();
await p.waitForSelector("dialog[open]:not([aria-busy])", { timeout: 30000 });
await p.waitForTimeout(400);
console.log("hard catalog page + composition link → url:", decodeURIComponent(new URL(p.url()).pathname), "dialog h2:", await p.locator("dialog[open] h2").first().textContent());
await p.screenshot({ path: `${out}/full-catalog-dialog@1440.png` });
// 3. full part page contract + screenshot
const res = await p.goto(`${base}/parts/dran-sword`, { waitUntil: "networkidle", timeout: 120000 });
await p.screenshot({ path: `${out}/full-part@1440.png`, fullPage: true });
const html = await p.content();
console.log("part page contract:", JSON.stringify(evaluatePartDetailHtml(html)), "dialogs:", await p.locator("dialog").count());
console.log("errors:", errors.length ? JSON.stringify(errors) : "none");
await browser.close();
