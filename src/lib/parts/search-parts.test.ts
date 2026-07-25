import { describe, expect, it } from "vitest";
import { searchParts } from "./search-parts";
import type { Part } from "./schema";

function part(overrides: Partial<Part> = {}): Part {
  return {
    id: "DRANSWORD",
    type: "blade",
    nameEn: "Dran Sword",
    nameJa: "ドランソード",
    nameZhTw: "蒼龍神劍",
    generation: "X",
    stats: { attack: 60, defense: 30, stamina: 25 },
    modes: [],
    releaseAt: "2022-05-10",
    statEditions: [],
    moldBatches: [],
    aliases: [],
    ...overrides,
  } as Part;
}

describe("searchParts", () => {
  const dranSword = part();
  const flat = part({
    id: "F",
    type: "bit",
    nameEn: "Flat",
    nameJa: "フラット",
    nameZhTw: "平底",
    stats: { attack: 40, defense: 15, stamina: 10, xDash: 35, burstResistance: 80 },
    aliases: ["F"],
  });
  const parts = [dranSword, flat];

  it("matches the English name regardless of current UI language", () => {
    expect(searchParts(parts, "Dran Sword")).toEqual([dranSword]);
  });

  it("matches the Japanese name", () => {
    expect(searchParts(parts, "ドランソード")).toEqual([dranSword]);
  });

  it("matches the Chinese name", () => {
    expect(searchParts(parts, "蒼龍神劍")).toEqual([dranSword]);
  });

  it("matches an alias", () => {
    expect(searchParts(parts, "F")).toEqual([flat]);
  });

  it("is case-insensitive", () => {
    expect(searchParts(parts, "dran sword")).toEqual([dranSword]);
  });

  it("tolerates extra or missing whitespace", () => {
    expect(searchParts(parts, "DranSword")).toEqual([dranSword]);
    expect(searchParts(parts, " Dran   Sword ")).toEqual([dranSword]);
  });

  it("matches on a partial substring", () => {
    expect(searchParts(parts, "Sword")).toEqual([dranSword]);
  });

  it("returns every part for an empty query", () => {
    expect(searchParts(parts, "")).toEqual(parts);
    expect(searchParts(parts, "   ")).toEqual(parts);
  });

  it("returns an empty array when nothing matches", () => {
    expect(searchParts(parts, "nonexistent part name")).toEqual([]);
  });
});
