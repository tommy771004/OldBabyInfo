import type { StockStatus } from "./parse-listing.ts";

export interface StockListing {
  id: string;
  partId: string | undefined;
  productName: string;
  retailer: string;
  productUrl: string;
  price: number;
  stockStatus: StockStatus;
  capturedAt: string;
  lastAttemptAt: string;
  scrapeStatus: "ok" | "failed";
  errorMessage?: string;
}

export interface StockListingStore {
  get(id: string): Promise<StockListing | undefined>;
  save(row: StockListing): Promise<void>;
}

export type ScrapeResult =
  | {
      id: string;
      partId: string | undefined;
      retailer: string;
      productUrl: string;
      productName: string;
      price: number;
      stockStatus: StockStatus;
    }
  | {
      id: string;
      partId: string | undefined;
      retailer: string;
      productUrl: string;
      error: string;
    };

export type PersistResult =
  | { kind: "saved"; listing: StockListing }
  | { kind: "marked-failed"; listing: StockListing }
  | { kind: "failure-without-existing-row" };

/**
 * Applies one scrape result to a store. A failed scrape is state on the
 * existing snapshot, not permission to replace its useful values with null
 * or zero. A first-time failure is kept out of the published table entirely.
 */
export async function persistScrapeResult(
  result: ScrapeResult,
  store: StockListingStore,
  attemptedAt: string,
): Promise<PersistResult> {
  if ("error" in result) {
    const existing = await store.get(result.id);
    if (!existing) return { kind: "failure-without-existing-row" };

    const listing: StockListing = {
      ...existing,
      lastAttemptAt: attemptedAt,
      scrapeStatus: "failed",
      errorMessage: result.error,
    };
    await store.save(listing);
    return { kind: "marked-failed", listing };
  }

  if (!Number.isFinite(result.price) || result.price <= 0) {
    throw new Error("A successful Stock Listing must have a positive price");
  }

  const listing: StockListing = {
    ...result,
    capturedAt: attemptedAt,
    lastAttemptAt: attemptedAt,
    scrapeStatus: "ok",
  };
  await store.save(listing);
  return { kind: "saved", listing };
}
