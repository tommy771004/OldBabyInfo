import { chromium } from "playwright";
const base = "http://localhost:3210";
const out = process.env.OUT;
const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36";
const browser = await chromium.launch();
for (const [w, h, mobile] of [[1440, 1000, false], [390, 844, true]]) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, isMobile: mobile, hasTouch: mobile, locale: "zh-TW", userAgent: UA });
  const p = await ctx.newPage();
  const errors = [];
  p.on("pageerror", e => errors.push(e.message.slice(0, 200)));
  for (const [name, url, link] of [
    ["part", "/parts", "A 加速"],
    ["blade", "/parts?catalogGeneration=x&catalogKind=part&catalogPartType=blade&catalogQuery=dran", "蒼龍神劍"],
    ["catalog", "/parts?catalogGeneration=x&catalogKind=beyblade", /蒼龍神劍 3-60 F 平坦/],
    ["card", "/parts?catalogGeneration=burst", null],
  ]) {
    await p.goto(`${base}${url}`, { waitUntil: "networkidle", timeout: 120000 });
    if (link) await p.getByRole("link", { name: link, exact: typeof link === "string" }).first().click();
    else await p.locator("li a").first().click();
    await p.waitForSelector("dialog[open]", { timeout: 30000 });
    await p.waitForTimeout(700);
    await p.screenshot({ path: `${out}/d-${name}@${w}.png` });
    const body = p.locator("dialog[open] > div > div").last();
    const m = await body.evaluate((el) => ({ sh: el.scrollHeight, ch: el.clientHeight, over: el.scrollWidth - el.clientWidth }));
    console.log(`[${w}] ${name} url=${decodeURIComponent(new URL(p.url()).pathname)} body=${JSON.stringify(m)}`);
    await body.evaluate((el) => { el.scrollTop = el.scrollHeight; });
    await p.waitForTimeout(300);
    await p.screenshot({ path: `${out}/d-${name}-end@${w}.png` });
  }
  console.log(`[${w}] errors=${errors.length ? JSON.stringify(errors) : "none"}`);
  await ctx.close();
}
await browser.close();
