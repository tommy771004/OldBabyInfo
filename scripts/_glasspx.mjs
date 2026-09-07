import { chromium } from "playwright";
import { createHash } from "node:crypto";

const port = process.env.PORT ?? "3000";
const outDir = process.argv[2];
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto(`http://localhost:${port}/parts`, { waitUntil: "networkidle", timeout: 60000 });
await page.waitForTimeout(800);

// A strip of the bar with no text or control in it, so what is sampled is the
// glass itself and not a glyph. If backdrop-filter were inert, this rectangle
// would be byte-identical at every scroll position.
const clip = { x: 950, y: 8, width: 170, height: 40 };
const seen = new Map();

for (const y of [0, 700, 1600, 4000]) {
  await page.evaluate((yy) => window.scrollTo(0, yy), y);
  await page.waitForTimeout(700);
  const buf = await page.screenshot({ clip });
  const hash = createHash("md5").update(buf).digest("hex").slice(0, 12);
  seen.set(y, hash);
  console.log(`scrollY=${String(y).padEnd(5)} bar-strip md5=${hash} bytes=${buf.length}`);
}

const distinct = new Set(seen.values()).size;
console.log(`\ndistinct renderings of the same strip: ${distinct} of ${seen.size}`);
console.log(
  distinct > 1
    ? "=> the bar's own pixels change with what scrolls behind it: it is sampling, the glass is real"
    : "=> IDENTICAL at every scroll position: the blur is inert and this is not glass",
);

await page.screenshot({ path: `${outDir}/glass-final.png`, clip: { x: 0, y: 0, width: 1440, height: 200 } });
await page.close();
await browser.close();
