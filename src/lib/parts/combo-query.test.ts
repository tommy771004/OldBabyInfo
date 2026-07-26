import { describe, expect, it } from "vitest";
import { buildComboQuery, parseComboSlugs } from "./combo-query.ts";

describe("parseComboSlugs", () => {
  it("reads all three independent slots", () => {
    expect(parseComboSlugs({ blade: "dran-sword", ratchet: "3-60", bit: "flat" })).toEqual({
      blade: "dran-sword",
      ratchet: "3-60",
      bit: "flat",
    });
  });

  it("leaves a slot undefined when its param is missing", () => {
    expect(parseComboSlugs({ blade: "dran-sword" })).toEqual({
      blade: "dran-sword",
      ratchet: undefined,
      bit: undefined,
    });
  });

  it("treats an empty-string param as unset, not a real slug", () => {
    expect(parseComboSlugs({ blade: "" })).toEqual({
      blade: undefined,
      ratchet: undefined,
      bit: undefined,
    });
  });
});

describe("buildComboQuery", () => {
  it("only includes slots that are actually set", () => {
    expect(buildComboQuery({ blade: "dran-sword" })).toEqual({ blade: "dran-sword" });
  });

  it("builds an empty object when nothing is selected", () => {
    expect(buildComboQuery({})).toEqual({});
  });
});
