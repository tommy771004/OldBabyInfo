import { chromium } from "playwright";

const port = process.env.PORT ?? "3000";
const browser = await chromium.launch();

// Sampling opacity at arbitrary scroll offsets is a poor probe -- it misses
// unless a step happens to land mid-range. Ask the browser directly instead:
// getAnimations() reports exactly which elements carry the animation and
// what timeline drives it.
for (const path of ["/guides", "/events", "/terms", "/parts", "/mold-batches", "/combo"]) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  try {
    await page.goto(`http://localhost:${port}${path}`, { waitUntil: "networkidle", timeout: 60000 });
    await page.waitForTimeout(600);
    const r = await page.evaluate(() => {
      const rows = [];
      let viewTimelines = 0;
      for (const el of document.querySelectorAll("main *")) {
        const anims = el.getAnimations().filter((a) => /pageFlow/.test(a.animationName || ""));
        if (!anims.length) continue;
        const isView = anims.some((a) => a.timeline && a.timeline.constructor.name === "ViewTimeline");
        if (isView) viewTimelines++;
        rows.push(`${el.tagName}${el.className ? "." + String(el.className).split(" ")[0].slice(0, 18) : ""}`);
      }
      return { count: rows.length, viewTimelines, sample: rows.slice(0, 8) };
    });
    console.log(
      `${path.padEnd(14)} animated elements=${String(r.count).padEnd(4)} on a ViewTimeline=${String(r.viewTimelines).padEnd(4)} ${r.count ? "" : "<-- NOTHING ANIMATED"}`,
    );
    console.log(`${"".padEnd(14)} ${r.sample.join(" ")}`);
  } catch (e) {
    console.log(`${path.padEnd(14)} skipped: ${e.message.slice(0, 50)}`);
  }
  await page.close();
}
await browser.close();
