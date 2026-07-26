import { describe, expect, it } from "vitest";
import { buildCalendarQuery, parseCalendarParams } from "./parse-calendar-params.ts";

describe("parseCalendarParams", () => {
  it("defaults to upcoming, page 1, no filters", () => {
    expect(parseCalendarParams({})).toEqual({
      scope: "upcoming",
      city: null,
      registration: null,
      age: null,
      page: 1,
    });
  });

  it("reads every axis from the URL", () => {
    expect(
      parseCalendarParams({ scope: "past", city: "高雄市", reg: "online", age: "通常 (6~12歲)", page: "3" }),
    ).toEqual({
      scope: "past",
      city: "高雄市",
      registration: "online",
      age: "通常 (6~12歲)",
      page: 3,
    });
  });

  it("falls back to the default scope on an unknown value rather than erroring", () => {
    expect(parseCalendarParams({ scope: "sideways" }).scope).toBe("upcoming");
  });

  it("rejects a registration method that isn't a real enum value", () => {
    expect(parseCalendarParams({ reg: "carrier-pigeon" }).registration).toBeNull();
  });

  it("falls back to page 1 for junk, zero, negative and fractional pages", () => {
    for (const page of ["abc", "0", "-2", "1.5", ""]) {
      expect(parseCalendarParams({ page }).page).toBe(1);
    }
  });

  it("treats an empty filter value as unset, not as a filter for empty string", () => {
    expect(parseCalendarParams({ city: "   " }).city).toBeNull();
  });

  it("takes the first value when a param is repeated", () => {
    expect(parseCalendarParams({ city: ["高雄市", "台北市"] }).city).toBe("高雄市");
  });
});

describe("buildCalendarQuery", () => {
  it("omits defaults so a clean view has a clean URL", () => {
    expect(buildCalendarQuery({ scope: "upcoming", page: 1 })).toEqual({});
  });

  it("includes only what differs from the default", () => {
    expect(buildCalendarQuery({ scope: "past", city: "高雄市", page: 2 })).toEqual({
      scope: "past",
      city: "高雄市",
      page: "2",
    });
  });

  it("drops page when it isn't passed, so changing a filter returns to page 1", () => {
    expect(buildCalendarQuery({ city: "台北市" })).toEqual({ city: "台北市" });
  });

  it("round-trips through parseCalendarParams", () => {
    const filters = {
      scope: "past" as const,
      city: "宜蘭縣",
      registration: "store_community" as const,
      age: "公開 (6歲以上)",
      page: 4,
    };
    expect(parseCalendarParams(buildCalendarQuery(filters))).toEqual(filters);
  });
});
