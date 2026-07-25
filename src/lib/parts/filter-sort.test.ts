import { describe, expect, it } from "vitest";
import { filterByType, sortParts } from "./filter-sort";
import type { Part } from "./schema";

function blade(nameEn: string, overrides: Partial<Part> = {}): Part {
  return {
    id: nameEn.toUpperCase(),
    type: "blade",
    nameEn,
    generation: "X",
    stats: { attack: 0, defense: 0, stamina: 0 },
    modes: [],
    releaseAt: null,
    statEditions: [],
    moldBatches: [],
    aliases: [],
    ...overrides,
  } as Part;
}

function bit(nameEn: string, overrides: Partial<Part> = {}): Part {
  return {
    id: nameEn.toUpperCase(),
    type: "bit",
    nameEn,
    generation: "X",
    stats: { attack: 0, defense: 0, stamina: 0, xDash: 0, burstResistance: 0 },
    modes: [],
    releaseAt: null,
    statEditions: [],
    moldBatches: [],
    aliases: [],
    ...overrides,
  } as Part;
}

describe("filterByType", () => {
  const parts = [blade("A"), bit("B"), blade("C")];

  it("returns only parts of the requested type", () => {
    expect(filterByType(parts, "blade").map((p) => p.nameEn)).toEqual(["A", "C"]);
  });

  it("returns every part when type is undefined", () => {
    expect(filterByType(parts, undefined)).toHaveLength(3);
  });
});

describe("sortParts", () => {
  it("sorts ascending by attack", () => {
    const parts = [
      blade("High", { stats: { attack: 60, defense: 0, stamina: 0 } }),
      blade("Low", { stats: { attack: 10, defense: 0, stamina: 0 } }),
    ];
    const sorted = sortParts(parts, "attack", "asc");
    expect(sorted.map((p) => p.nameEn)).toEqual(["Low", "High"]);
  });

  it("sorts descending by defense", () => {
    const parts = [
      blade("Low", { stats: { attack: 0, defense: 10, stamina: 0 } }),
      blade("High", { stats: { attack: 0, defense: 60, stamina: 0 } }),
    ];
    const sorted = sortParts(parts, "defense", "desc");
    expect(sorted.map((p) => p.nameEn)).toEqual(["High", "Low"]);
  });

  it("treats xDash/burstResistance as 0 for parts that don't carry them (blade/ratchet)", () => {
    const parts = [
      bit("BitHigh", { stats: { attack: 0, defense: 0, stamina: 0, xDash: 50, burstResistance: 0 } }),
      blade("BladeZero"),
    ];
    const sorted = sortParts(parts, "xDash", "desc");
    expect(sorted.map((p) => p.nameEn)).toEqual(["BitHigh", "BladeZero"]);
  });

  it("sorts by releaseAt, treating null as oldest", () => {
    const parts = [
      blade("Dated", { releaseAt: "2023-01-01" }),
      blade("Undated", { releaseAt: null }),
    ];
    const sorted = sortParts(parts, "releaseAt", "asc");
    expect(sorted.map((p) => p.nameEn)).toEqual(["Undated", "Dated"]);
  });

  it("does not mutate the input array", () => {
    const parts = [
      blade("B", { stats: { attack: 60, defense: 0, stamina: 0 } }),
      blade("A", { stats: { attack: 10, defense: 0, stamina: 0 } }),
    ];
    const original = [...parts];
    sortParts(parts, "attack", "asc");
    expect(parts).toEqual(original);
  });
});
