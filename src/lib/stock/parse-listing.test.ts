import { describe, expect, it } from "vitest";
import { parseStockListing } from "./parse-listing.ts";

describe("parseStockListing", () => {
  it("parses a Taiwan dollar price and an in-stock label deterministically", () => {
    expect(
      parseStockListing({
        productName: "BX-01 Dran Sword",
        priceText: "NT$1,299",
        stockText: "有庫存",
      }),
    ).toEqual({
      productName: "BX-01 Dran Sword",
      price: 1299,
      stockStatus: "in_stock",
    });
  });

  it("recognises sold-out labels without treating them as zero price", () => {
    expect(
      parseStockListing({
        productName: "Dran Sword",
        priceText: "NT$ 1,299",
        stockText: "售罄",
      }),
    ).toEqual({
      productName: "Dran Sword",
      price: 1299,
      stockStatus: "out_of_stock",
    });
  });

  it("rejects an unusable price instead of returning a fake zero", () => {
    expect(() =>
      parseStockListing({
        productName: "Dran Sword",
        priceText: "請洽詢",
        stockText: "有庫存",
      }),
    ).toThrow("price");
  });
});
