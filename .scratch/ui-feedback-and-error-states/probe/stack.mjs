import { chromium } from "playwright";
const base = `http://localhost:${process.env.PORT ?? "3000"}`;
const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36";
const browser = await chromium.launch();
const c = await browser.newContext({ viewport: { width: 1440, height: 1000 }, locale: "zh-TW", userAgent: UA });
const p = await c.newPage();
await p.goto(base + "/", { waitUntil: "load" }); await p.waitForTimeout(500);
const sb = p.locator("[role=combobox]").first();
await sb.fill("dran"); await p.waitForTimeout(600);
const r = await p.evaluate(() => {
  const list = document.querySelector("[role=listbox]");
  const opts = [...list.querySelectorAll("[role=option]")];
  const out = { count: opts.length, listZ: getComputedStyle(list).zIndex, listBg: getComputedStyle(list).backgroundColor, listPos: getComputedStyle(list).position, hidden: [] };
  for (const o of opts) {
    const b = o.getBoundingClientRect();
    const top = document.elementFromPoint(b.left + 20, b.top + b.height / 2);
    if (!o.contains(top)) out.hidden.push({ text: o.textContent.trim().slice(0, 24), coveredBy: top?.tagName + "." + (top?.className?.baseVal ?? top?.className ?? "").toString().slice(0, 40) });
  }
  // find the covering element's z-index chain
  const img = document.querySelector("img");
  out.imgZ = img ? getComputedStyle(img).zIndex : null;
  let el = out.hidden.length ? document.elementFromPoint(opts[2].getBoundingClientRect().left + 20, opts[2].getBoundingClientRect().top + 10) : null;
  const chain = [];
  while (el && el !== document.body) { const cs = getComputedStyle(el); if (cs.position !== "static" || cs.zIndex !== "auto") chain.push(`${el.tagName}.${(el.className?.baseVal ?? el.className ?? "").toString().slice(0,30)} pos=${cs.position} z=${cs.zIndex}`); el = el.parentElement; }
  out.coverChain = chain;
  let l = list; const lchain = [];
  while (l && l !== document.body) { const cs = getComputedStyle(l); if (cs.position !== "static" || cs.zIndex !== "auto") lchain.push(`${l.tagName}.${(l.className ?? "").toString().slice(0,30)} pos=${cs.position} z=${cs.zIndex}`); l = l.parentElement; }
  out.listChain = lchain;
  return out;
});
console.log(JSON.stringify(r, null, 1));
// keyboard: arrow down + enter selects?
await sb.press("ArrowDown"); await sb.press("Enter"); await p.waitForTimeout(800);
console.log("after enter, lane title:", (await p.locator("main").innerText()).slice(0, 160).replace(/\n+/g, " | "));
await browser.close();
