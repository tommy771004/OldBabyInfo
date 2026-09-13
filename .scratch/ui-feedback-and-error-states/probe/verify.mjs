import { chromium } from "playwright";
const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36";
const browser = await chromium.launch();
// 3. part detail: why do the two <p><Link> overlap? measure the link's box and its parent's
{
  const c = await browser.newContext({ viewport: { width: 1440, height: 1000 }, locale: "zh-TW", userAgent: UA });
  const p = await c.newPage();
  await p.goto(`http://localhost:${process.env.PORT ?? "3000"}/parts/dran-sword`, { waitUntil: "load" }); await p.waitForTimeout(500);
  const r = await p.evaluate(() => {
    const out = [];
    for (const a of document.querySelectorAll("main section > p > a")) {
      const para = a.parentElement, prev = para.previousElementSibling;
      const cs = getComputedStyle(para), pcs = getComputedStyle(a);
      const ab = a.getBoundingClientRect(), pb = para.getBoundingClientRect(), prevb = prev?.getBoundingClientRect();
      out.push({ text: a.textContent.trim(), paraH: Math.round(pb.height), linkH: Math.round(ab.height), paraTop: Math.round(pb.top + scrollY), prevBottom: prev ? Math.round(prevb.bottom + scrollY) : null, prevTag: prev?.tagName + "." + (prev?.className || "").toString().slice(0, 30), paraDisplay: cs.display, paraMargin: cs.marginTop + "/" + cs.marginBottom, linkDisplay: pcs.display, prevPos: prev ? getComputedStyle(prev).position : null, prevH: prev ? Math.round(prevb.height) : null, prevOverflow: prev ? getComputedStyle(prev).overflow : null });
    }
    return out;
  });
  console.log("PART LINKS", JSON.stringify(r, null, 1));
  // Also: what is the previous element's scrollHeight vs clientHeight (is content overflowing a fixed-height box?)
  const r2 = await p.evaluate(() => [...document.querySelectorAll("main section")].map(s => ({ cls: s.className.slice(0, 40), h: Math.round(s.getBoundingClientRect().height), sh: s.scrollHeight, kids: [...s.children].map(k => k.tagName + ":" + Math.round(k.getBoundingClientRect().height)).join(",") })));
  console.log("SECTIONS", JSON.stringify(r2, null, 1));
  // 1. events: open a disclosure and click 資料來源
  await p.goto(`http://localhost:${process.env.PORT ?? "3000"}/events`, { waitUntil: "load" }); await p.waitForTimeout(500);
  const summary = p.locator("summary").first(); await summary.click(); await p.waitForTimeout(300);
  const link = p.locator("details[open] a", { hasText: "資料來源" }).first();
  console.log("events link visible:", await link.isVisible(), "href:", await link.getAttribute("href"), "target:", await link.getAttribute("target"));
  const bb = await link.boundingBox();
  const hit = await p.evaluate(([x, y]) => document.elementFromPoint(x, y)?.closest("a")?.textContent?.trim() ?? "not a link", [bb.x + 10, bb.y + bb.height / 2]);
  console.log("events link hit-test after open:", hit);
  await c.close();
}
// 2. mobile: click option 3 and read the lane
{
  const c = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, locale: "zh-TW", userAgent: UA });
  const p = await c.newPage();
  await p.goto(`http://localhost:${process.env.PORT ?? "3000"}/`, { waitUntil: "load" }); await p.waitForTimeout(500);
  const sb = p.locator("[role=combobox]").first();
  await sb.fill("dran"); await p.waitForTimeout(600);
  const opts = p.locator("[role=option]");
  const n = await opts.count();
  const reach = [];
  for (let i = 0; i < n; i++) { const b = await opts.nth(i).boundingBox(); reach.push(await p.evaluate(([x, y]) => !!document.elementFromPoint(x, y)?.closest("[role=option]"), [b.x + 30, b.y + b.height / 2])); }
  console.log("mobile options reachable:", JSON.stringify(reach));
  const b3 = await opts.nth(2).boundingBox();
  await p.touchscreen.tap(b3.x + 30, b3.y + b3.height / 2); await p.waitForTimeout(800);
  console.log("mobile after tap option 3:", (await p.locator("main").innerText()).slice(0, 60).replace(/\n+/g, " | "));
  await sb.fill("dran"); await p.waitForTimeout(600);
  const b6 = await opts.nth(5).boundingBox();
  await p.touchscreen.tap(b6.x + 30, b6.y + b6.height / 2); await p.waitForTimeout(800);
  console.log("mobile after tap option 6:", (await p.locator("main").innerText()).slice(0, 60).replace(/\n+/g, " | "));
  await c.close();
}
await browser.close();
