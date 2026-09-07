import { describe, expect, it, vi } from "vitest";
import type { Part } from "../parts/schema.ts";
import { discoverFunboxListings, FunboxFetchError, type FunboxCategorySource } from "./funbox-discovery.ts";
import { buildReleaseRecords } from "../generation-catalog/releases.ts";

const part: Part = {
  id: "DRANSWORD",
  nameEn: "Dran Sword",
  nameJa: "ドランソード",
  nameZhTw: "赤龍劍",
  aliases: [],
  generation: "X",
  releaseAt: "2023-07-15",
  type: "blade",
  stats: { attack: 55, defense: 0, stamina: 0 },
  modes: [],
  statEditions: [],
  moldBatches: [],
};

const sources: FunboxCategorySource[] = [
  { id: "bxa", endpoint: "https://example.com/bxa.json" },
  { id: "bxb", endpoint: "https://example.com/bxb.json" },
  { id: "bxc", endpoint: "https://example.com/bxc.json" },
];

describe("discoverFunboxListings", () => {
  it("attaches a unique Funbox row to a Release and isolates ambiguous rows", async () => {
    const releases = buildReleaseRecords({
      sourceId: "takaratomy-fixture",
      sourceUrl: "https://example.com/releases",
      sourceVersion: "revision:1",
      generationId: "x",
      system: "bx",
      products: [
        { sourceRecordId: "BX-01-JP", sku: "BX-01", name: "Dran Sword Starter", region: "JP" },
        { sourceRecordId: "BX-01-TW", sku: "BX-01-TW", name: "Dran Sword Starter", region: "TW" },
      ],
    }).filter((record) => record.kind === "release");

    const result = await discoverFunboxListings(
      [sources[0]!],
      [],
      {
        releases,
        fetcher: vi.fn().mockResolvedValue([
          { id: 40, url: "/products/bx-01", title: "BX-01", price: 1299, variants: [] },
          { id: 41, url: "/products/ambiguous", title: "Dran Sword Starter", price: 999, variants: [] },
        ]),
        minIntervalMs: 0,
      },
    );

    expect(result.listings).toMatchObject([{
      id: "funbox-product-40",
      releaseId: releases[0]!.id,
    }]);
    expect(result.needsReview).toBe(1);
  });

  it("fetches categories, attaches uniquely matched Parts and keeps empty categories empty", async () => {
    const fetcher = vi.fn()
      .mockResolvedValueOnce([
        {
          id: 10,
          url: "/products/dran-sword",
          title: "戰鬥陀螺X Dran Sword",
          price: 1299,
          variants: [{ inventory_quantity: 2 }],
        },
      ])
      .mockResolvedValueOnce([])
      .mockRejectedValueOnce(new Error("category timeout"));

    await expect(
      // One attempt per source keeps this case about the three categories,
      // not about the retry ladder, which has its own tests below.
      discoverFunboxListings(sources, [part], {
        fetcher,
        minIntervalMs: 0,
        sleep: vi.fn(),
        retry: { attempts: 1 },
      }),
    ).resolves.toEqual({
      listings: [
        {
          id: "funbox-product-10",
          partId: "DRANSWORD",
          productName: "戰鬥陀螺X Dran Sword",
          productUrl: "https://shop.funbox.com.tw/products/dran-sword",
          price: 1299,
          stockStatus: "in_stock",
        },
      ],
      skippedRows: 0,
      needsReview: 0,
      failedSources: [{ id: "bxc", error: "category timeout" }],
    });
    expect(fetcher).toHaveBeenCalledTimes(3);
  });

  it("does not publish a title that cannot be matched to one Part", async () => {
    const result = await discoverFunboxListings(
      [sources[0]!],
      [part],
      {
        fetcher: vi.fn().mockResolvedValue([
          { id: 20, url: "/products/starter", title: "Beyblade X starter set", price: 999, variants: [] },
        ]),
        minIntervalMs: 0,
      },
    );

    expect(result.listings).toEqual([]);
    expect(result.needsReview).toBe(1);
  });

  it("continues a category until the next page is empty", async () => {
    const fetcher = vi.fn()
      .mockResolvedValueOnce([
        { id: 30, url: "/products/dran-sword-page-1", title: "Dran Sword", price: 1299, variants: [] },
      ])
      .mockResolvedValueOnce([]);

    const result = await discoverFunboxListings(
      [{ id: "paged", endpoint: "https://example.com/category.json?limit=1&page=1" }],
      [part],
      { fetcher, minIntervalMs: 0 },
    );

    expect(result.listings).toHaveLength(1);
    expect(fetcher).toHaveBeenNthCalledWith(2, "https://example.com/category.json?limit=1&page=2");
  });

  it("retries a transport failure and keeps the listing it recovers", async () => {
    // The scheduled runner sees bare `fetch failed` when Funbox refuses the
    // datacenter address. That is exactly the case a second attempt can win.
    const fetcher = vi.fn()
      .mockRejectedValueOnce(new TypeError("fetch failed"))
      .mockResolvedValueOnce([
        { id: 50, url: "/products/dran-sword", title: "Dran Sword", price: 1299, variants: [] },
      ])
      .mockResolvedValueOnce([]);
    const sleep = vi.fn().mockResolvedValue(undefined);

    const result = await discoverFunboxListings([sources[0]!], [part], {
      fetcher,
      minIntervalMs: 0,
      sleep,
      retry: { attempts: 3, baseDelayMs: 1_000, maxDelayMs: 8_000 },
    });

    expect(result.failedSources).toEqual([]);
    expect(result.listings).toHaveLength(1);
    expect(sleep).toHaveBeenCalledWith(1_000);
  });

  it("backs off exponentially up to the cap before giving up", async () => {
    const fetcher = vi.fn().mockRejectedValue(new TypeError("fetch failed"));
    const sleep = vi.fn().mockResolvedValue(undefined);

    const result = await discoverFunboxListings([sources[0]!], [part], {
      fetcher,
      minIntervalMs: 0,
      sleep,
      retry: { attempts: 4, baseDelayMs: 1_000, maxDelayMs: 3_000 },
    });

    expect(fetcher).toHaveBeenCalledTimes(4);
    expect(sleep.mock.calls.map(([delay]) => delay)).toEqual([1_000, 2_000, 3_000]);
    expect(result.failedSources).toEqual([{ id: "bxa", error: "fetch failed" }]);
  });

  it("does not retry a status Funbox has already settled", async () => {
    const fetcher = vi.fn().mockRejectedValue(new FunboxFetchError("Funbox category returned 404", 404));
    const sleep = vi.fn().mockResolvedValue(undefined);

    const result = await discoverFunboxListings([sources[0]!], [part], {
      fetcher,
      minIntervalMs: 0,
      sleep,
      retry: { attempts: 3, baseDelayMs: 1_000 },
    });

    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(sleep).not.toHaveBeenCalled();
    expect(result.failedSources).toEqual([{ id: "bxa", error: "Funbox category returned 404" }]);
  });

  it("retries a throttled or unhealthy status", async () => {
    const fetcher = vi.fn()
      .mockRejectedValueOnce(new FunboxFetchError("Funbox category returned 429", 429))
      .mockRejectedValueOnce(new FunboxFetchError("Funbox category returned 503", 503))
      .mockResolvedValueOnce([]);
    const sleep = vi.fn().mockResolvedValue(undefined);

    const result = await discoverFunboxListings([sources[0]!], [part], {
      fetcher,
      minIntervalMs: 0,
      sleep,
      retry: { attempts: 3, baseDelayMs: 500 },
    });

    expect(fetcher).toHaveBeenCalledTimes(3);
    expect(result.failedSources).toEqual([]);
  });

  it("treats a malformed payload as a skipped row, not a retryable failure", async () => {
    // The retry ladder wraps the fetch alone. A body that arrived but does not
    // describe products is a data problem, so the source is neither retried nor
    // reported as failed.
    const fetcher = vi.fn().mockResolvedValue({ not: "an array of products" });
    const sleep = vi.fn().mockResolvedValue(undefined);

    const result = await discoverFunboxListings([sources[0]!], [part], {
      fetcher,
      minIntervalMs: 0,
      sleep,
      retry: { attempts: 3, baseDelayMs: 1_000 },
    });

    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(sleep).not.toHaveBeenCalled();
    expect(result.failedSources).toEqual([]);
    expect(result.skippedRows).toBe(1);
  });
});
