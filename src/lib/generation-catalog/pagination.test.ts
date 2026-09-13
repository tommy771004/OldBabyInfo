import { describe, expect, it } from "vitest";
import { parseCatalogPage, parseCatalogPageSize, parseCatalogPaginationParams } from "./pagination.ts";

describe("parseCatalogPaginationParams", () => {
  it("defaults to ten records on the first page", () => {
    expect(parseCatalogPaginationParams({}, 295)).toEqual({
      page: 1,
      pageSize: 10,
      totalPages: 30,
      start: 0,
      end: 10,
    });
  });

  it("accepts only 10, 20 and 50", () => {
    expect(parseCatalogPaginationParams({ catalogSize: "50", catalogPage: "2" }, 295)).toEqual({
      page: 2,
      pageSize: 50,
      totalPages: 6,
      start: 50,
      end: 100,
    });
    expect(parseCatalogPaginationParams({ catalogSize: "15" }, 295).pageSize).toBe(10);
    expect(parseCatalogPageSize("20")).toBe(20);
    expect(parseCatalogPageSize("0")).toBe(10);
  });

  it("clamps a shared URL to the last page and survives an empty result", () => {
    expect(parseCatalogPaginationParams({ catalogPage: "99" }, 25)).toMatchObject({ page: 3, start: 20, end: 25 });
    expect(parseCatalogPaginationParams({ catalogPage: "99" }, 0)).toEqual({
      page: 1,
      pageSize: 10,
      totalPages: 1,
      start: 0,
      end: 0,
    });
  });

  it("reads the requested page before the total is known", () => {
    expect(parseCatalogPage("7")).toBe(7);
    expect(parseCatalogPage("-2")).toBe(1);
    expect(parseCatalogPage(undefined)).toBe(1);
  });
});
