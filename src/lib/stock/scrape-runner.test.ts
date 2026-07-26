import { describe, expect, it } from "vitest";
import { shouldSkipProductScrape } from "./scrape-runner.ts";

describe("shouldSkipProductScrape", () => {
  it("treats an empty reviewed target set as a safe no-op", () => {
    expect(shouldSkipProductScrape([])).toBe(true);
  });

  it("runs when at least one reviewed target exists", () => {
    expect(shouldSkipProductScrape([{
      id: "funbox-dranbuster",
      partId: "DRANBUSTER",
      retailer: "Funbox",
      productUrl: "https://shop.funbox.com.tw/products/example",
    }])).toBe(false);
  });
});
