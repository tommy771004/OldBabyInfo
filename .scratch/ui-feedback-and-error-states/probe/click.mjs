import { chromium } from "playwright";
const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36";
const browser = await chromium.launch();
for (const [w,h,m] of [[1440,1000,false],[390,844,true]]) {
  const c = await browser.newContext({ viewport: { width: w, height: h }, isMobile: m, hasTouch: m, locale: "zh-TW", userAgent: UA });
  const p = await c.newPage();
  await p.goto(`http://localhost:${process.env.PORT ?? "3000"}/`, { waitUntil: "load" }); await p.waitForTimeout(500);
  const sb = p.locator("[role=combobox]").first();
  await sb.fill("dran"); await p.waitForTimeout(600);
  const opt = p.locator("[role=option]").nth(2);
  const b = await opt.boundingBox();
  await p.mouse.click(b.x + 30, b.y + b.height / 2); await p.waitForTimeout(800);
  const t = (await p.locator("main").innerText()).slice(0, 80).replace(/\n+/g, " | ");
  console.log(`${w}: clicked option 3 (${(await opt.textContent()).trim().slice(0,20)}) -> lane now: ${t}`);
  if (m) { await sb.fill("dran"); await p.waitForTimeout(600); await p.screenshot({ path: "./shots/m_home_search.png" }); }
  await c.close();
}
await browser.close();
