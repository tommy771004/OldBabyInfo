import { describe, expect, it, vi } from "vitest";
import { scrapeProductTargets, type ProductTarget } from "./scraper.ts";

const target: ProductTarget = {
  id: "funbox-dran-sword",
  partId: "dran-sword",
  retailer: "Funbox",
  productUrl: "https://example.com/dran-sword",
};

describe("scrapeProductTargets", () => {
  it("uses structured data before the Playwright loader", async () => {
    const playrightLoader = vi.fn();
    const structuredLoader = vi.fn().mockResolvedValue({
      productName: "Dran Sword",
      priceText: "NT$1,299",
      stockText: "有庫存",
    });

    const [result] = await scrapeProductTargets(
      [target],
      { structured: structuredLoader, playwright: playrightLoader },
      { minIntervalMs: 0, sleep: vi.fn() },
    );

    expect(result).toMatchObject({ productName: "Dran Sword", price: 1299, stockStatus: "in_stock" });
    expect(structuredLoader).toHaveBeenCalledWith(target);
    expect(playrightLoader).not.toHaveBeenCalled();
  });

  it("falls back to Playwright when no structured response is available", async () => {
    const playwrightLoader = vi.fn().mockResolvedValue({
      productName: "Dran Sword",
      priceText: "NT$1,299",
      stockText: "售罄",
    });

    const [result] = await scrapeProductTargets(
      [target],
      { structured: vi.fn().mockResolvedValue(null), playwright: playwrightLoader },
      { minIntervalMs: 0, sleep: vi.fn() },
    );

    expect(result).toMatchObject({ stockStatus: "out_of_stock", price: 1299 });
    expect(playwrightLoader).toHaveBeenCalledWith(target);
  });

  it("keeps calls spaced apart and returns a failure result for bad pages", async () => {
    const sleep = vi.fn().mockResolvedValue(undefined);
    const results = await scrapeProductTargets(
      [target, { ...target, id: "funbox-wizard-arrow" }],
      {
        playwright: vi
          .fn()
          .mockRejectedValueOnce(new Error("timeout"))
          .mockResolvedValueOnce({
            productName: "Wizard Arrow",
            priceText: "請洽詢",
            stockText: "有庫存",
          }),
      },
      { minIntervalMs: 1500, sleep },
    );

    expect(sleep).toHaveBeenCalledWith(1500);
    expect(results[0]).toEqual({
      id: target.id,
      partId: target.partId,
      retailer: target.retailer,
      productUrl: target.productUrl,
      error: "timeout",
    });
    expect(results[1]?.error).toContain("price");
  });
});
