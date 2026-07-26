import { describe, expect, it } from "vitest";
import { computeComboStats } from "./combo-stats.ts";
import type { Part } from "./schema.ts";

/**
 * Minimal builders — every field this module doesn't read is filled with
 * an arbitrary valid placeholder, only `stats` (and `height` for Ratchet)
 * carry the real numbers under test.
 */
function blade(stats: { attack: number; defense: number; stamina: number }): Part {
  return {
    id: "T",
    nameEn: "T",
    aliases: [],
    moldBatches: [],
    generation: "X",
    releaseAt: null,
    type: "blade",
    stats,
    modes: [],
    statEditions: [],
  };
}

function ratchet(stats: { attack: number; defense: number; stamina: number }): Part {
  return {
    id: "T",
    nameEn: "T",
    aliases: [],
    moldBatches: [],
    generation: "X",
    releaseAt: null,
    type: "ratchet",
    stats,
    height: 60,
    statEditions: [],
  };
}

function bit(stats: {
  attack: number;
  defense: number;
  stamina: number;
  xDash: number;
  burstResistance: number;
}): Part {
  return {
    id: "T",
    nameEn: "T",
    aliases: [],
    moldBatches: [],
    generation: "X",
    releaseAt: null,
    type: "bit",
    stats,
    modes: [],
    statEditions: [],
  };
}

describe("computeComboStats", () => {
  // Three known-good cases from ADR-0007 / ticket 04, hand-verified against
  // official MasterData.json and cross-checked against beybrew's own
  // comboUtils.js output — not tautological, the expected sums are an
  // independent source of truth written down before this function existed.

  it("matches the Dran Sword + 3-60 + Flat case", () => {
    const result = computeComboStats(
      blade({ attack: 60, defense: 30, stamina: 25 }),
      ratchet({ attack: 15, defense: 9, stamina: 6 }),
      bit({ attack: 40, defense: 15, stamina: 10, xDash: 35, burstResistance: 80 }),
    );
    expect(result).toEqual({ attack: 115, defense: 54, stamina: 41, xDash: 35, burstResistance: 80 });
  });

  it("matches the Wizard Arrow + 4-60 + Ball case", () => {
    const result = computeComboStats(
      blade({ attack: 15, defense: 30, stamina: 55 }),
      ratchet({ attack: 11, defense: 13, stamina: 6 }),
      bit({ attack: 15, defense: 25, stamina: 50, xDash: 10, burstResistance: 30 }),
    );
    expect(result).toEqual({ attack: 41, defense: 68, stamina: 111, xDash: 10, burstResistance: 30 });
  });

  it("matches the Shark Edge + 9-80 + Taper case", () => {
    const result = computeComboStats(
      blade({ attack: 65, defense: 30, stamina: 20 }),
      ratchet({ attack: 13, defense: 10, stamina: 7 }),
      bit({ attack: 35, defense: 20, stamina: 20, xDash: 25, burstResistance: 80 }),
    );
    expect(result).toEqual({ attack: 113, defense: 60, stamina: 47, xDash: 25, burstResistance: 80 });
  });

  it("treats a missing piece as a real 0 contribution, not an error", () => {
    const result = computeComboStats(blade({ attack: 60, defense: 30, stamina: 25 }), undefined, undefined);
    expect(result).toEqual({ attack: 60, defense: 30, stamina: 25, xDash: 0, burstResistance: 0 });
  });

  it("never lets Blade or Ratchet contribute X-Dash/Burst Resistance even if selected", () => {
    const result = computeComboStats(
      blade({ attack: 10, defense: 10, stamina: 10 }),
      ratchet({ attack: 10, defense: 10, stamina: 10 }),
      undefined,
    );
    expect(result.xDash).toBe(0);
    expect(result.burstResistance).toBe(0);
  });
});
