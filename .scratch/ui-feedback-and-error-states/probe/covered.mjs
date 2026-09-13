import { chromium } from "playwright";
const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36";
const browser = await chromium.launch();
const routes = ["/", "/parts/dran-sword", "/parts/compare?parts=dran-sword,hells-scythe", "/combo?blade=dran-sword", "/meta", "/events", "/mold-batches", "/guides", "/discussion"];
for (const [w, h, m] of [[1440, 1000, false], [390, 844, true]]) {
  const c = await browser.newContext({ viewport: { width: w, height: h }, isMobile: m, hasTouch: m, locale: "zh-TW", userAgent: UA });
  for (const r of routes) {
    const p = await c.newPage();
    await p.goto(`http://localhost:${process.env.PORT ?? "3000"}` + r, { waitUntil: "load" }); await p.waitForTimeout(600);
    const res = await p.evaluate(async () => {
      const out = [];
      const els = [...document.querySelectorAll("main a, main button, main summary")];
      for (const el of els) {
        const b = el.getBoundingClientRect();
        if (!b.width || !b.height) continue;
        window.scrollTo(0, b.top + scrollY - innerHeight / 2);
        await new Promise(r => setTimeout(r, 30));
        const bb = el.getBoundingClientRect();
        const top = document.elementFromPoint(bb.left + Math.min(12, bb.width / 2), bb.top + bb.height / 2);
        if (top && !el.contains(top) && !top.contains(el)) out.push({ text: el.textContent.trim().slice(0, 24), by: top.tagName + "." + (top.className?.baseVal ?? top.className ?? "").toString().slice(0, 36), y: Math.round(bb.top + scrollY) });
      }
      return out;
    });
    if (res.length) console.log(`${r}@${w}:`, JSON.stringify(res));
    await p.close();
  }
  await c.close();
}
await browser.close();
