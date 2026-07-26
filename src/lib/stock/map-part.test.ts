import { describe, expect, it } from "vitest";
import type { Part } from "@/lib/parts/schema.ts";
import { mapProductToPart } from "./map-part.ts";

const makePart = (id: string, nameEn: string, aliases: string[] = []): Part => ({
  id,
  nameEn,
  nameJa: undefined,
  nameZhTw: undefined,
  aliases,
  generation: "X",
  releaseAt: null,
  type: "blade",
  stats: { attack: 1, defense: 1, stamina: 1 },
  modes: [],
  statEditions: [],
  moldBatches: [],
});

describe("mapProductToPart", () => {
  it("maps an exact official name or alias to one Part", () => {
    const part = makePart("dran-sword", "Dran Sword", ["DS"]);

    expect(mapProductToPart("BX-01 Dran Sword", [part])).toEqual({
      kind: "matched",
      part,
    });
  });

  it("records an unknown product instead of guessing from a partial name", () => {
    expect(mapProductToPart("Dran Buster", [makePart("dran-sword", "Dran Sword")])).toEqual({
      kind: "unmatched",
      productName: "Dran Buster",
    });
  });

  it("records ambiguity when two Parts share an alias", () => {
    const parts = [
      makePart("one", "First", ["F"]),
      makePart("two", "Second", ["F"]),
    ];

    expect(mapProductToPart("F", parts)).toEqual({
      kind: "ambiguous",
      productName: "F",
      candidates: parts,
    });
  });
});
