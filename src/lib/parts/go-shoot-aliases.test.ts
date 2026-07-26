import { describe, expect, it } from "vitest";
import { mergeGoShootAliases, type GoShootPartRecord } from "./go-shoot-aliases.ts";
import type { Part } from "./schema.ts";

const part: Part = {
  id: "DRANSWORD",
  nameEn: "Dran Sword",
  aliases: ["蒼龍神劍"],
  moldBatches: [],
  generation: "X",
  releaseAt: null,
  type: "blade",
  stats: { attack: 60, defense: 30, stamina: 25 },
  modes: [],
  statEditions: [],
};

describe("Go-Shoot alias merge", () => {
  it("adds exact abbreviation and source-provided aliases without replacing existing aliases", () => {
    const records: GoShootPartRecord[] = [
      {
        abbr: "DrSw",
        names: { eng: "DranSword", hasbro: "Sword Dran", aka: "蒼龍" },
      },
    ];

    expect(mergeGoShootAliases([part], records)[0]?.aliases).toEqual([
      "蒼龍神劍",
      "DrSw",
      "Sword Dran",
      "蒼龍",
    ]);
  });

  it("does not fuzzy-match a different Part or import one-character noise", () => {
    const records: GoShootPartRecord[] = [
      { abbr: "A", names: { eng: "Dran" } },
      { abbr: "ShEd", names: { eng: "SharkEdge" } },
    ];

    expect(mergeGoShootAliases([part], records)[0]?.aliases).toEqual(["蒼龍神劍"]);
  });
});
