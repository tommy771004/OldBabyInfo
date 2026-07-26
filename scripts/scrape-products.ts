/**
 * Product scrape runner (tickets 21 and 23).
 *
 * The target file is intentionally empty until a real retailer URL and its
 * stable selectors have been reviewed. No invented product data belongs in
 * the catalog. Once targets are added, this runner prefers a structured JSON
 * endpoint, falls back to Playwright for dynamic pages, and persists through
 * the failure-safe Stock Listing repository.
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { chromium, type Browser } from "playwright";
import { neon } from "@neondatabase/serverless";
import { z } from "zod";
import { scrapeProductTargets, type ProductTarget } from "../src/lib/stock/scraper.ts";
import { persistScrapeResult } from "../src/lib/stock/repository.ts";
import {
  createSqlStockListingStore,
  type SqlClient,
  type StockListingRow,
} from "../src/lib/stock/sql-store.ts";
import type { RawProductSnapshot } from "../src/lib/stock/parse-listing.ts";

const __dirname = dirname(fileURLToPath(import.meta.url));
const TARGETS_PATH = join(__dirname, "..", "data", "product-targets.json");
const userAgent = "OldBabyInfo product-data-bot/1.0 (https://oldbabyinfo.dev/data-policy)";

const targetSchema = z.object({
  id: z.string().min(1),
  partId: z.string().min(1).optional(),
  retailer: z.string().min(1),
  productUrl: z.url(),
  structuredUrl: z.url().optional(),
  selectors: z
    .object({
      productName: z.string().min(1),
      price: z.string().min(1),
      stock: z.string().min(1),
    })
    .optional(),
});

const targetsSchema = z.array(targetSchema);
const structuredSnapshotSchema = z.object({
  productName: z.string(),
  priceText: z.string(),
  stockText: z.string(),
});

function readTargets(): ProductTarget[] {
  return targetsSchema.parse(JSON.parse(readFileSync(TARGETS_PATH, "utf8"))).map((target) => ({
    ...target,
    partId: target.partId,
  }));
}

async function snapshotFromStructuredEndpoint(target: ProductTarget): Promise<RawProductSnapshot | null> {
  if (!target.structuredUrl) return null;
  const response = await fetch(target.structuredUrl, {
    headers: { "user-agent": userAgent, accept: "application/json" },
  });
  if (!response.ok) throw new Error(`Structured endpoint returned ${response.status}`);
  return structuredSnapshotSchema.parse(await response.json());
}

function createPlaywrightLoader(browser: Browser) {
  return async (target: ProductTarget): Promise<RawProductSnapshot> => {
    if (!target.selectors) {
      throw new Error(`No reviewed Playwright selectors configured for ${target.id}`);
    }

    const context = await browser.newContext({ userAgent });
    const page = await context.newPage();
    try {
      await page.goto(target.productUrl, { waitUntil: "domcontentloaded", timeout: 30_000 });
      const [productName, priceText, stockText] = await Promise.all([
        page.locator(target.selectors.productName).first().textContent({ timeout: 15_000 }),
        page.locator(target.selectors.price).first().textContent({ timeout: 15_000 }),
        page.locator(target.selectors.stock).first().textContent({ timeout: 15_000 }),
      ]);
      if (!productName || !priceText || !stockText) {
        throw new Error(`Required product fields were empty for ${target.id}`);
      }
      return { productName, priceText, stockText };
    } finally {
      await context.close();
    }
  };
}

async function main() {
  const targets = readTargets();
  if (targets.length === 0) {
    throw new Error(`No product targets are configured in ${TARGETS_PATH}`);
  }

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL is not set");

  const dryRun = process.argv.includes("--dry-run");
  const minIntervalMs = Number(process.env.PRODUCT_SCRAPE_INTERVAL_MS ?? 10_000);
  const browser = await chromium.launch();
  try {
    const neonSql = neon(connectionString);
    const sql: SqlClient = {
      async query(text, params = []) {
        const rows = await neonSql.query(text, [...params]);
        return { rows: rows as StockListingRow[] };
      },
    };
    const store = createSqlStockListingStore(sql);
    const results = await scrapeProductTargets(
      targets,
      {
        structured: snapshotFromStructuredEndpoint,
        playwright: createPlaywrightLoader(browser),
      },
      { minIntervalMs },
    );

    const attemptedAt = new Date().toISOString();
    let failures = 0;
    for (const result of results) {
      if (dryRun) {
        console.log(JSON.stringify(result));
        continue;
      }
      const persisted = await persistScrapeResult(result, store, attemptedAt);
      if (persisted.kind !== "saved") failures += 1;
      if ("error" in result) console.error(`${result.id}: ${result.error}`);
    }

    console.log(`Scraped ${results.length} targets; ${failures} existing rows marked failed.`);
    if (failures > 0) process.exitCode = 1;
  } finally {
    await browser.close();
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
