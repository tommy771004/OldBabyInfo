import { describe, expect, it } from "vitest";
import { localizedNameOf } from "./localized-name";
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
    statEditions: [],
    moldBatches: [],
    aliases: [],
    ...overrides,
  } as Part;
}

describe("localizedNameOf", () => {
  it("returns the Chinese name for zh-TW", () => {
    expect(localizedNameOf(part(), "zh-TW")).toBe("蒼龍神劍");
  });

  it("returns the Japanese name for ja", () => {
    expect(localizedNameOf(part(), "ja")).toBe("ドランソード");
  });

  it("returns the English name for en", () => {
    expect(localizedNameOf(part(), "en")).toBe("Dran Sword");
  });

  it("falls back to the English name when the Chinese name is missing", () => {
    expect(localizedNameOf(part({ nameZhTw: undefined }), "zh-TW")).toBe("Dran Sword");
  });

  it("falls back to the English name when the Japanese name is missing", () => {
    expect(localizedNameOf(part({ nameJa: undefined }), "ja")).toBe("Dran Sword");
  });
});
