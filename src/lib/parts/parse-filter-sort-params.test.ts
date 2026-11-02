import { describe, expect, it } from "vitest";
import { parseFilterSortParams } from "./parse-filter-sort-params";

describe("parseFilterSortParams", () => {
  it("defaults to no sort and ascending direction when nothing is given", () => {
    expect(parseFilterSortParams({})).toEqual({
      sort: undefined,
      direction: "asc",
    });
  });

  it("does not carry the retired `type` filter", () => {
    expect(parseFilterSortParams({ type: "bit" })).not.toHaveProperty("type");
  });

  it("parses a valid sort field and direction", () => {
    expect(parseFilterSortParams({ sort: "attack", dir: "desc" })).toEqual({
      sort: "attack",
      direction: "desc",
    });
  });

  it("ignores an invalid sort field", () => {
    expect(parseFilterSortParams({ sort: "not_a_field" }).sort).toBeUndefined();
  });

  it("falls back to ascending on an invalid direction", () => {
    expect(parseFilterSortParams({ sort: "attack", dir: "sideways" }).direction).toBe("asc");
  });
});
