import { describe, expect, it } from "vitest";
import { parseRatchetTeeth, ratchetTeethOf, ratchetTeethParam } from "./ratchet-spec.ts";
import { getAllParts } from "./repository.ts";
import type { Part } from "./schema.ts";

function ratchet(nameEn: string): Part {
  return {
    id: nameEn,
    nameEn,
    aliases: [],
    moldBatches: [],
    generation: "X",
    releaseAt: null,
    type: "ratchet",
    stats: { attack: 1, defense: 1, stamina: 1 },
    height: 60,
    statEditions: [],
  };
}

describe("ratchetTeethOf", () => {
  it("reads the tooth count off the Ratchet's own official name", () => {
    expect(ratchetTeethOf(ratchet("3-60"))).toBe(3);
    expect(ratchetTeethOf(ratchet("0-80"))).toBe(0);
    expect(ratchetTeethOf(ratchet("9-70"))).toBe(9);
  });

  it("reads the metal Ratchet as its own value, not as a number", () => {
    expect(ratchetTeethOf(ratchet("M-85"))).toBe("metal");
  });

  it("has an answer for every real Ratchet in the seed", () => {
    const ratchets = getAllParts().filter((part) => part.type === "ratchet");

    expect(ratchets.length).toBeGreaterThan(0);
    expect(ratchets.filter((part) => ratchetTeethOf(part) === undefined)).toEqual([]);
  });

  it("returns nothing for a Part kind that has no teeth", () => {
    const blade = getAllParts().find((part) => part.type === "blade");

    expect(ratchetTeethOf(blade!)).toBeUndefined();
  });
});

describe("ratchet teeth params", () => {
  it("round-trips through the URL", () => {
    for (const teeth of [0, 3, 9, "metal"] as const) {
      expect(parseRatchetTeeth(ratchetTeethParam(teeth))).toBe(teeth);
    }
  });

  it("ignores a hand-edited value rather than throwing on it", () => {
    expect(parseRatchetTeeth("12")).toBeUndefined();
    expect(parseRatchetTeeth("gold")).toBeUndefined();
    expect(parseRatchetTeeth(undefined)).toBeUndefined();
  });
});
