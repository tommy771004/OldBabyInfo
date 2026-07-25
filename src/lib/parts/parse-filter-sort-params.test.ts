import { describe, expect, it } from "vitest";
import { parseFilterSortParams } from "./parse-filter-sort-params";

describe("parseFilterSortParams", () => {
  it("defaults to no type filter and ascending direction when nothing is given", () => {
    expect(parseFilterSortParams({})).toEqual({
      type: undefined,
      sort: undefined,
      direction: "asc",
    });
  });

  it("parses a valid type", () => {
    expect(parseFilterSortParams({ type: "bit" }).type).toBe("bit");
  });

  it("ignores an invalid type rather than throwing on a hand-edited URL", () => {
    expect(parseFilterSortParams({ type: "lock_chip" }).type).toBeUndefined();
  });

  it("parses a valid sort field and direction", () => {
    expect(parseFilterSortParams({ sort: "attack", dir: "desc" })).toEqual({
      type: undefined,
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
