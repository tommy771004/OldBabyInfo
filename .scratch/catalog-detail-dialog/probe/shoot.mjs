import { chromium } from "playwright";
const base = "http://localhost:3210";
const out = process.env.OUT;
const routes = ["/parts/dran-sword"];
const browser = await chromium.launch();
for (const [w, h, mobile] of [[1440, 1000, false], [390, 844, true]]) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, isMobile: mobile, hasTouch: mobile, locale: "zh-TW", userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36" });
  for (const r of routes) {
    const p = await ctx.newPage();
    try {
      const res = await p.goto(base + r, { waitUntil: "load", timeout: 120000 });
      await p.waitForTimeout(800);
      const name = r.replace(/[^a-z0-9]+/gi, "_").replace(/^_/, "");
      await p.screenshot({ path: `${out}/${name}@${w}.png`, fullPage: true });
      const height = await p.evaluate(() => document.documentElement.scrollHeight);
      console.log(`${r}@${w} status=${res?.status()} height=${height} url=${p.url()}`);
    } catch (e) { console.log(`${r}@${w} ERROR ${e.message.slice(0, 120)}`); }
    await p.close();
  }
  await ctx.close();
}
await browser.close();
