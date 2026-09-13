import { chromium } from "playwright";
const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36";
const browser = await chromium.launch();
const c = await browser.newContext({ viewport: { width: 1440, height: 1000 }, locale: "zh-TW", userAgent: UA });
const p = await c.newPage();
await p.goto(`http://localhost:${process.env.PORT ?? "3000"}/parts/dran-sword`, { waitUntil: "load" }); await p.waitForTimeout(600);
await p.screenshot({ path: "./shots/part_overlap_crop.png", fullPage: true, clip: { x: 100, y: 2150, width: 900, height: 400 } });
// find overlapping text elements: any two leaf text boxes intersecting
const overlaps = await p.evaluate(() => {
  const leaves = [...document.querySelectorAll("main a, main p, main h2, main h3, main span, main dd, main dt, main li")].filter(e => e.children.length === 0 && e.textContent.trim());
  const out = [];
  for (let i = 0; i < leaves.length; i++) for (let j = i + 1; j < leaves.length; j++) {
    const a = leaves[i].getBoundingClientRect(), b = leaves[j].getBoundingClientRect();
    if (!a.width || !b.width) continue;
    const ix = Math.min(a.right, b.right) - Math.max(a.left, b.left), iy = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
    if (ix > 8 && iy > 8 && !leaves[i].contains(leaves[j]) && !leaves[j].contains(leaves[i])) out.push([leaves[i].textContent.trim().slice(0, 30), leaves[j].textContent.trim().slice(0, 30), Math.round(a.top + scrollY)]);
  }
  return out;
});
console.log(JSON.stringify(overlaps));
await browser.close();
