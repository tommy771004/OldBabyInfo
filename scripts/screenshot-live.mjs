import { chromium } from "playwright";

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
const errors = [];
page.on("pageerror", (e) => errors.push(`JS ERROR: ${e}`));
page.on("requestfailed", (r) => errors.push(`REQUEST FAILED: ${r.url()} - ${r.failure()?.errorText}`));
page.on("console", (msg) => {
  if (msg.type() === "error") errors.push(`CONSOLE ERROR: ${msg.text()}`);
});

await page.goto("https://old-baby-info.vercel.app/", { waitUntil: "networkidle" });
await page.screenshot({
  path: "/private/tmp/claude-501/-Users-tommy-Documents-Proj-OldBabyInfo/a62f4c28-0286-4a1a-9c72-90a59a0299eb/scratchpad/live-site.png",
  fullPage: true,
});

const bodyBg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
const bodyColor = await page.evaluate(() => getComputedStyle(document.body).color);
const h1Text = await page.evaluate(() => document.querySelector("h1")?.textContent ?? "NO H1 FOUND");

console.log("body background:", bodyBg);
console.log("body color:", bodyColor);
console.log("h1 text:", h1Text);
console.log("ERRORS:", JSON.stringify(errors, null, 2));

await browser.close();
