import {
  evaluateMoldBatchGuidanceHtml,
  evaluatePartDetailHtml,
  evaluatePublicNavigationHtml,
  evaluatePublicSemanticsHtml,
} from "../src/lib/public-journey/html-contract.ts";

const baseUrl = process.env.PUBLIC_JOURNEY_BASE_URL ?? "http://localhost:3000";
const locales = (process.env.PUBLIC_JOURNEY_LOCALES ?? "zh-TW,en,ja")
  .split(",")
  .map((locale) => locale.trim())
  .filter(Boolean);

for (const locale of locales) {
  const publicRoutes = [
    "",
    "parts",
    "parts/compare",
    "combo",
    "events",
    "guides",
    "meta",
    "mold-batches",
    "discussion",
    "login",
  ];
  for (const route of publicRoutes) {
    const routeUrl = `${baseUrl}/${locale}${route ? `/${route}` : "/"}`;
    const response = await fetch(routeUrl);
    if (!response.ok) throw new Error(`Public route returned ${response.status} for ${routeUrl}`);

    const html = await response.text();
    const navigationResult = evaluatePublicNavigationHtml(html);
    if (navigationResult.status === "invalid") {
      throw new Error(`Public navigation contract failed for ${routeUrl}: ${navigationResult.failures.join("; ")}`);
    }
    const semanticsResult = evaluatePublicSemanticsHtml(html);
    if (semanticsResult.status === "invalid") {
      throw new Error(`Public semantic contract failed for ${routeUrl}: ${semanticsResult.failures.join("; ")}`);
    }
    if (route === "mold-batches") {
      const guidanceResult = evaluateMoldBatchGuidanceHtml(html);
      if (guidanceResult.status === "invalid") {
        throw new Error(`Mold Batch guidance contract failed for ${routeUrl}: ${guidanceResult.failures.join("; ")}`);
      }
    }
  }

  const url = `${baseUrl}/${locale}/parts/dran-sword`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Public Part journey returned ${response.status} for ${locale}`);

  const result = evaluatePartDetailHtml(await response.text());
  if (result.status === "invalid") {
    throw new Error(`Public Part journey contract failed for ${locale}: ${result.failures.join("; ")}`);
  }

  console.log(`Public Part journey contract passed: ${url}`);
}
