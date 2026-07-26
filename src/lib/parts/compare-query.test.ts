import { describe, expect, it } from "vitest";
import { buildCompareQuery, canAddMore, parseCompareSlugs } from "./compare-query.ts";

describe("parseCompareSlugs", () => {
  it("splits a comma-separated query value into slugs", () => {
    expect(parseCompareSlugs("dran-sword,scorpio-spear")).toEqual([
      "dran-sword",
      "scorpio-spear",
    ]);
  });

  it("returns an empty array when the param is missing", () => {
    expect(parseCompareSlugs(undefined)).toEqual([]);
  });

  it("drops duplicates", () => {
    expect(parseCompareSlugs("dran-sword,dran-sword")).toEqual(["dran-sword"]);
  });

  it("caps at 4 even if the URL was hand-edited to list more", () => {
    const raw = "a,b,c,d,e,f";
    expect(parseCompareSlugs(raw)).toEqual(["a", "b", "c", "d"]);
  });

  it("ignores empty segments from stray commas", () => {
    expect(parseCompareSlugs("a,,b,")).toEqual(["a", "b"]);
  });
});

describe("buildCompareQuery", () => {
  it("builds a shareable query object from a slug list", () => {
    expect(buildCompareQuery(["a", "b"])).toEqual({ with: "a,b" });
  });

  it("omits the param entirely when the list is empty", () => {
    expect(buildCompareQuery([])).toEqual({});
  });
});

describe("canAddMore", () => {
  it("allows adding below the 4-part cap", () => {
    expect(canAddMore(["a", "b"])).toBe(true);
  });

  it("blocks adding at the cap", () => {
    expect(canAddMore(["a", "b", "c", "d"])).toBe(false);
  });
});
