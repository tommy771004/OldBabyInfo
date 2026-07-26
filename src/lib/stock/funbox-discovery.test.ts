import { describe, expect, it, vi } from "vitest";
import type { Part } from "../parts/schema.ts";
import { discoverFunboxListings, type FunboxCategorySource } from "./funbox-discovery.ts";

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
      discoverFunboxListings(sources, [part], { fetcher, minIntervalMs: 0, sleep: vi.fn() }),
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
});
