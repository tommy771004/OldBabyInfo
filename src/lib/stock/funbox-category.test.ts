import fixture from "../../../data/funbox-category-fixture.json";
import { describe, expect, it } from "vitest";
import type { Part } from "../parts/schema.ts";
import { matchFunboxProductToPart, parseFunboxCategoryProducts } from "./funbox-category.ts";

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

describe("parseFunboxCategoryProducts", () => {
  it("normalizes a reviewed Funbox row into a stock candidate", () => {
    expect(parseFunboxCategoryProducts(fixture)).toEqual({
      listings: [
        {
          id: "funbox-product-12345",
          productName: "戰鬥陀螺X Dran Sword 基本組",
          productUrl: "https://shop.funbox.com.tw/products/beyblade-x-dran-sword",
          price: 1299,
          stockStatus: "in_stock",
        },
      ],
      skippedRows: 0,
    });
  });

  it("keeps an empty category empty and does not invent a listing", () => {
    expect(parseFunboxCategoryProducts([])).toEqual({ listings: [], skippedRows: 0 });
  });

  it("skips malformed or external rows and preserves unknown inventory", () => {
    expect(
      parseFunboxCategoryProducts([
        { id: "unknown", url: "/products/unknown", title: "Unknown", price: 999, variants: [{ inventory_quantity: null }] },
        { id: "bad", url: "https://evil.example/product", title: "Do not import", price: 99 },
        { id: "invalid", url: "/products/invalid", title: "", price: 10 },
      ]),
    ).toEqual({
      listings: [
        {
          id: "funbox-product-unknown",
          productName: "Unknown",
          productUrl: "https://shop.funbox.com.tw/products/unknown",
          price: 999,
          stockStatus: "unknown",
        },
      ],
      skippedRows: 2,
    });
  });
});

describe("matchFunboxProductToPart", () => {
  it("only attaches a product to a uniquely named Part", () => {
    expect(matchFunboxProductToPart("戰鬥陀螺X Dran Sword 基本組", [part])).toBe("DRANSWORD");
    expect(matchFunboxProductToPart("戰鬥陀螺 X starter set", [part])).toBeUndefined();
  });
});
