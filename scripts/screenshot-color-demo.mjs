import { chromium } from "playwright";

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 2200 } });
await page.goto("http://localhost:3416/color-demo", { waitUntil: "networkidle" });
await page.screenshot({
  path: "/private/tmp/claude-501/-Users-tommy-Documents-Proj-OldBabyInfo/a62f4c28-0286-4a1a-9c72-90a59a0299eb/scratchpad/color-demo.png",
  fullPage: true,
});
await browser.close();
console.log("screenshot saved");
