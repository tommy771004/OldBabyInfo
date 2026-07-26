import { describe, expect, it } from "vitest";
import { matchPartByName } from "./match-part.ts";
import type { Part } from "../parts/schema.ts";

function blade(overrides: Partial<Part> = {}): Part {
  return {
    id: "DRANSWORD",
    nameEn: "Dran Sword",
    nameJa: "ドランソード",
    nameZhTw: "蒼龍神劍",
    aliases: ["DS", "神劍"],
    moldBatches: [],
    generation: "X",
    releaseAt: null,
    type: "blade",
    stats: { attack: 60, defense: 30, stamina: 25 },
    modes: [],
    statEditions: [],
    ...overrides,
  } as Part;
}

describe("matchPartByName", () => {
  const parts = [blade()];

  it("matches the official English name exactly", () => {
    expect(matchPartByName("Dran Sword", parts)?.id).toBe("DRANSWORD");
  });

  it("matches a real alias", () => {
    expect(matchPartByName("神劍", parts)?.id).toBe("DRANSWORD");
  });

  it("is case- and whitespace-insensitive", () => {
    expect(matchPartByName("dran   sword", parts)?.id).toBe("DRANSWORD");
  });

  it("does NOT fuzzy-match a similar-but-different name — returns undefined rather than guessing", () => {
    expect(matchPartByName("Dran Buster", parts)).toBeUndefined();
  });

  it("returns undefined for an empty string rather than matching everything", () => {
    expect(matchPartByName("", parts)).toBeUndefined();
  });

  it("returns undefined when nothing matches, not the closest guess", () => {
    expect(matchPartByName("完全不存在的零件", parts)).toBeUndefined();
  });
});
