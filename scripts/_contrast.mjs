import { chromium } from "playwright";

const port = process.env.PORT ?? "3000";
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto(`http://localhost:${port}/parts`, { waitUntil: "networkidle", timeout: 60000 });
await page.waitForTimeout(800);

// Worst case for a dark translucent bar is sitting over the LIGHTEST content
// the site has, so scroll to a position where the reading surface is behind it.
await page.evaluate(() => window.scrollTo(0, 900));
await page.waitForTimeout(700);

// Where the quietest nav label actually is, measured not guessed.
const box = await page.evaluate(() => {
  const items = [...document.querySelectorAll("header a")];
  const quiet = items.find((a) => !a.hasAttribute("aria-current") && a.textContent.trim().length <= 4);
  if (!quiet) return null;
  const r = quiet.getBoundingClientRect();
  return { text: quiet.textContent.trim(), x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) };
});
if (!box) { console.log("no quiet nav label found"); process.exit(1); }
console.log("measuring label:", JSON.stringify(box));

const shot = (await page.screenshot({ clip: { x: box.x, y: box.y, width: box.w, height: box.h } })).toString("base64");

// Decode through the browser's own canvas: no image library needed.
const result = await page.evaluate(async (b64) => {
  const img = new Image();
  img.src = "data:image/png;base64," + b64;
  await img.decode();
  const c = document.createElement("canvas");
  c.width = img.width; c.height = img.height;
  const ctx = c.getContext("2d", { willReadFrequently: true });
  ctx.drawImage(img, 0, 0);
  const d = ctx.getImageData(0, 0, c.width, c.height).data;

  const lum = (r, g, b) => {
    const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
  };
  const px = [];
  for (let i = 0; i < d.length; i += 4) px.push({ l: lum(d[i], d[i + 1], d[i + 2]), rgb: [d[i], d[i + 1], d[i + 2]] });
  px.sort((a, b) => a.l - b.l);
  // Glyph core = the brightest pixels (light ink on a dark bar).
  // Bar surface = the darkest, which inside a label's box is the glass itself.
  const lo = px[Math.floor(px.length * 0.05)];
  const hi = px[Math.floor(px.length * 0.98)];
  return { bar: lo, ink: hi, ratio: (hi.l + 0.05) / (lo.l + 0.05), n: px.length };
}, shot);

const hex = (p) => "#" + p.rgb.map((v) => v.toString(16).padStart(2, "0")).join("");
console.log(`bar surface rendered: ${hex(result.bar)}`);
console.log(`label ink rendered:   ${hex(result.ink)}`);
console.log(`MEASURED contrast (with saturate(135%) applied): ${result.ratio.toFixed(2)}:1`);
console.log(result.ratio >= 4.5 ? "PASSES WCAG AA" : "FAILS WCAG AA");

await page.close();
await browser.close();
