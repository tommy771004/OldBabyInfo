import { chromium } from "playwright";
const base = `http://localhost:${process.env.PORT ?? "3000"}`;
const out = "./shots";
const routes = ["/zh-TW", "/zh-TW/parts", "/zh-TW/parts/dran-sword", "/zh-TW/parts/compare?a=dran-sword&b=hells-scythe", "/zh-TW/combo", "/zh-TW/combo?blade=dran-sword", "/zh-TW/meta", "/zh-TW/events", "/zh-TW/mold-batches", "/zh-TW/parts?q=zzzzzz", "/zh-TW/does-not-exist"];
const browser = await chromium.launch();
for (const [w, h, mobile] of [[1440, 1000, false], [390, 844, true]]) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, isMobile: mobile, hasTouch: mobile, locale: "zh-TW", userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36" });
  for (const r of routes) {
    const p = await ctx.newPage();
    const msgs = [];
    p.on("console", m => { if (m.type() === "error" || m.type() === "warning") msgs.push(m.text().slice(0, 160)); });
    try {
      const res = await p.goto(base + r, { waitUntil: "load", timeout: 90000 });
      await p.waitForTimeout(800);
      const name = r.replace(/[^a-z0-9]+/gi, "_").replace(/^_/, "") || "home";
      await p.screenshot({ path: `${out}/${name}@${w}.png`, fullPage: true });
      const over = await p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      const height = await p.evaluate(() => document.documentElement.scrollHeight);
      console.log(`${r}@${w} status=${res?.status()} height=${height} overflow=${over} console=${msgs.length ? JSON.stringify(msgs.slice(0,3)) : "-"}`);
    } catch (e) { console.log(`${r}@${w} ERROR ${e.message.slice(0, 120)}`); }
    await p.close();
  }
  await ctx.close();
}
await browser.close();
