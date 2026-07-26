import { parseStockListing, type RawProductSnapshot } from "./parse-listing.ts";
import type { ScrapeResult } from "./repository.ts";

export interface ProductTarget {
  id: string;
  partId: string | undefined;
  retailer: string;
  productUrl: string;
  structuredUrl?: string;
  selectors?: {
    productName: string;
    price: string;
    stock: string;
  };
}

export interface ProductLoaders {
  structured?: (target: ProductTarget) => Promise<RawProductSnapshot | null>;
  playwright: (target: ProductTarget) => Promise<RawProductSnapshot>;
}

export interface ScrapeOptions {
  minIntervalMs?: number;
  sleep?: (durationMs: number) => Promise<void>;
}

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

async function scrapeProductTarget(
  target: ProductTarget,
  loaders: ProductLoaders,
): Promise<ScrapeResult> {
  let snapshot: RawProductSnapshot | null = null;

  if (loaders.structured) {
    try {
      snapshot = await loaders.structured(target);
    } catch {
      // A structured endpoint is an optimisation, so a failed optional call
      // falls through to the browser path rather than hiding a product.
    }
  }

  if (!snapshot) {
    try {
      snapshot = await loaders.playwright(target);
    } catch (error) {
      return {
        id: target.id,
        partId: target.partId,
        retailer: target.retailer,
        productUrl: target.productUrl,
        error: messageOf(error),
      };
    }
  }

  try {
    return {
      id: target.id,
      partId: target.partId,
      retailer: target.retailer,
      productUrl: target.productUrl,
      ...parseStockListing(snapshot),
    };
  } catch (error) {
    return {
      id: target.id,
      partId: target.partId,
      retailer: target.retailer,
      productUrl: target.productUrl,
      error: messageOf(error),
    };
  }
}

export async function scrapeProductTargets(
  targets: ProductTarget[],
  loaders: ProductLoaders,
  options: ScrapeOptions = {},
): Promise<ScrapeResult[]> {
  const minIntervalMs = Math.max(0, options.minIntervalMs ?? 1000);
  const sleep = options.sleep ?? ((durationMs: number) => new Promise<void>((resolve) => setTimeout(resolve, durationMs)));
  const results: ScrapeResult[] = [];

  for (const [index, target] of targets.entries()) {
    if (index > 0 && minIntervalMs > 0) await sleep(minIntervalMs);
    results.push(await scrapeProductTarget(target, loaders));
  }

  return results;
}
