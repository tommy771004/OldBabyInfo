import { chromium } from "playwright";
const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36";
const browser = await chromium.launch();
const c = await browser.newContext({ viewport: { width: 1440, height: 1000 }, locale: "zh-TW", userAgent: UA });
const p = await c.newPage();
await p.goto(`http://localhost:${process.env.PORT ?? "3000"}/parts/dran-sword`, { waitUntil: "load" }); await p.waitForTimeout(500);
const probe = () => p.evaluate(() => {
  const inner = document.querySelectorAll("main .assessment-tracer_section___jpzZ, main section section");
  return [...inner].map(s => ({ cls: s.className.slice(0, 26), transform: getComputedStyle(s).transform, anim: getComputedStyle(s).animationName, timeline: getComputedStyle(s).animationTimeline, top: Math.round(s.getBoundingClientRect().top + scrollY) }));
});
console.log("at scroll 0:", JSON.stringify(await probe()));
await p.evaluate(() => window.scrollTo(0, 2300)); await p.waitForTimeout(600);
console.log("scrolled to 2300:", JSON.stringify(await probe()));
const overlapNow = await p.evaluate(() => {
  const a = [...document.querySelectorAll("main section > p > a")].find(x => x.textContent.includes("通路快照"));
  const para = a.parentElement, prev = para.previousElementSibling;
  return { paraTop: Math.round(para.getBoundingClientRect().top + scrollY), prevBottom: Math.round(prev.getBoundingClientRect().bottom + scrollY) };
});
console.log("overlap after scroll:", JSON.stringify(overlapNow));
await p.screenshot({ path: process.env.S + "/shots/part_after_scroll.png", clip: { x: 100, y: 2150 - 2300 + 0, width: 900, height: 400 } }).catch(e => console.log(e.message.slice(0, 80)));
await browser.close();
