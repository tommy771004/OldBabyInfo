import { describe, expect, it } from "vitest";
import { persistScrapeResult, type StockListing, type StockListingStore } from "./repository.ts";

const existing: StockListing = {
  id: "funbox-dran-sword",
  partId: "dran-sword",
  productName: "Dran Sword",
  retailer: "Funbox",
  productUrl: "https://example.com/dran-sword",
  price: 1299,
  stockStatus: "in_stock",
  capturedAt: "2026-07-25T12:00:00.000Z",
  lastAttemptAt: "2026-07-25T12:00:00.000Z",
  scrapeStatus: "ok",
};

function memoryStore(initial: StockListing[] = []) {
  const rows = new Map(initial.map((row) => [row.id, row]));
  const store: StockListingStore = {
    async get(id) {
      return rows.get(id);
    },
    async save(row) {
      rows.set(row.id, row);
    },
  };
  return { rows, store };
}

describe("persistScrapeResult", () => {
  it("writes a successful listing with the capture time", async () => {
    const { rows, store } = memoryStore();

    await persistScrapeResult(
      {
        id: "funbox-dran-sword",
        partId: "dran-sword",
        retailer: "Funbox",
        productUrl: "https://example.com/dran-sword",
        productName: "Dran Sword",
        price: 1399,
        stockStatus: "in_stock",
      },
      store,
      "2026-07-26T12:00:00.000Z",
    );

    expect(rows.get("funbox-dran-sword")).toMatchObject({
      price: 1399,
      stockStatus: "in_stock",
      capturedAt: "2026-07-26T12:00:00.000Z",
      lastAttemptAt: "2026-07-26T12:00:00.000Z",
      scrapeStatus: "ok",
    });
  });

  it("keeps the last good value when a later scrape fails", async () => {
    const { rows, store } = memoryStore([existing]);

    await persistScrapeResult(
      {
        id: existing.id,
        partId: existing.partId,
        retailer: existing.retailer,
        productUrl: existing.productUrl,
        error: "Retailer timed out",
      },
      store,
      "2026-07-26T12:00:00.000Z",
    );

    expect(rows.get(existing.id)).toEqual({
      ...existing,
      lastAttemptAt: "2026-07-26T12:00:00.000Z",
      scrapeStatus: "failed",
      errorMessage: "Retailer timed out",
    });
  });

  it("does not create a fake row when the first scrape fails", async () => {
    const { rows, store } = memoryStore();

    const result = await persistScrapeResult(
      {
        id: "unknown-product",
        partId: undefined,
        retailer: "Funbox",
        productUrl: "https://example.com/unknown-product",
        error: "Product page unavailable",
      },
      store,
      "2026-07-26T12:00:00.000Z",
    );

    expect(result).toEqual({ kind: "failure-without-existing-row" });
    expect(rows.size).toBe(0);
  });
});
