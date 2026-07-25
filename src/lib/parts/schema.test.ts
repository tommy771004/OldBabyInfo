import { describe, expect, it } from "vitest";
import { partSchema, partsFileSchema } from "./schema";

function validBlade(overrides: Record<string, unknown> = {}) {
  return {
    id: "DRANSWORD",
    type: "blade",
    nameEn: "Dran Sword",
    generation: "X",
    stats: { attack: 60, defense: 30, stamina: 25 },
    releaseAt: "2022-05-10",
    statEditions: [],
    moldBatches: [],
    aliases: [],
    ...overrides,
  };
}

function validBit(overrides: Record<string, unknown> = {}) {
  return {
    id: "FLAT",
    type: "bit",
    nameEn: "Flat",
    generation: "X",
    stats: { attack: 40, defense: 15, stamina: 10, xDash: 35, burstResistance: 80 },
    releaseAt: "2022-05-10",
    statEditions: [],
    moldBatches: [],
    aliases: [],
    ...overrides,
  };
}

function validRatchet(overrides: Record<string, unknown> = {}) {
  return {
    id: "3-60",
    type: "ratchet",
    nameEn: "3-60",
    generation: "X",
    stats: { attack: 15, defense: 9, stamina: 6 },
    height: 60,
    releaseAt: "2022-05-10",
    statEditions: [],
    moldBatches: [],
    aliases: [],
    ...overrides,
  };
}

describe("partSchema", () => {
  it("accepts a valid blade with three-stat shape", () => {
    const result = partSchema.safeParse(validBlade());
    expect(result.success).toBe(true);
  });

  it("accepts a valid bit with five-stat shape", () => {
    const result = partSchema.safeParse(validBit());
    expect(result.success).toBe(true);
  });

  it("rejects a blade whose stats include xDash — blades don't carry that stat", () => {
    const result = partSchema.safeParse(
      validBlade({ stats: { attack: 60, defense: 30, stamina: 25, xDash: 10 } }),
    );
    expect(result.success).toBe(false);
  });

  it("rejects a bit missing xDash or burstResistance", () => {
    const result = partSchema.safeParse(
      validBit({ stats: { attack: 40, defense: 15, stamina: 10 } }),
    );
    expect(result.success).toBe(false);
  });

  it("rejects a negative stat value", () => {
    const result = partSchema.safeParse(
      validBlade({ stats: { attack: -1, defense: 30, stamina: 25 } }),
    );
    expect(result.success).toBe(false);
  });

  it("accepts a half-point stat value — some ratchets are documented with .5 stats", () => {
    const result = partSchema.safeParse(
      validBlade({ stats: { attack: 12, defense: 8.5, stamina: 9.5 } }),
    );
    expect(result.success).toBe(true);
  });

  it("rejects an unknown part type", () => {
    const result = partSchema.safeParse(validBlade({ type: "lock_chip" }));
    expect(result.success).toBe(false);
  });

  it("accepts a null releaseAt — some parts never matched an official record", () => {
    const result = partSchema.safeParse(validBlade({ releaseAt: null }));
    expect(result.success).toBe(true);
  });

  it("rejects a part with releaseAt omitted entirely — must be explicit, even if null", () => {
    const withoutReleaseAt = {
      id: "DRANSWORD",
      type: "blade",
      nameEn: "Dran Sword",
      generation: "X",
      stats: { attack: 60, defense: 30, stamina: 25 },
    };
    const result = partSchema.safeParse(withoutReleaseAt);
    expect(result.success).toBe(false);
  });

  it("defaults aliases and statEditions to empty arrays when omitted", () => {
    const minimal = {
      id: "DRANSWORD",
      type: "blade",
      nameEn: "Dran Sword",
      generation: "X",
      stats: { attack: 60, defense: 30, stamina: 25 },
      releaseAt: "2022-05-10",
    };
    const result = partSchema.safeParse(minimal);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.aliases).toEqual([]);
      expect(result.data.statEditions).toEqual([]);
      expect(result.data.moldBatches).toEqual([]);
    }
  });

  it("accepts a statEdition whose stats match the part's own stat shape", () => {
    const result = partSchema.safeParse(
      validBlade({
        statEditions: [
          {
            label: "BX-01 (2022 standard release)",
            releaseAt: "2022-05-10",
            stats: { attack: 55, defense: 25, stamina: 20 },
          },
        ],
      }),
    );
    expect(result.success).toBe(true);
  });

  it("rejects a statEdition whose stats use the wrong shape for the part type", () => {
    const result = partSchema.safeParse(
      validBlade({
        statEditions: [
          {
            label: "wrong shape",
            releaseAt: null,
            stats: { attack: 55, defense: 25, stamina: 20, xDash: 10, burstResistance: 10 },
          },
        ],
      }),
    );
    expect(result.success).toBe(false);
  });

  it("accepts a blade with multiple physical modes instead of a single stats block", () => {
    const result = partSchema.safeParse(
      validBlade({
        modes: [
          { label: "Defense", stats: { attack: 25, defense: 55, stamina: 30 } },
          { label: "Attack", stats: { attack: 55, defense: 25, stamina: 30 } },
        ],
      }),
    );
    expect(result.success).toBe(true);
  });

  it("defaults modes to an empty array when the part has only one form", () => {
    const result = partSchema.safeParse(validBlade());
    expect(result.success).toBe(true);
    if (result.success && result.data.type === "blade") {
      expect(result.data.modes).toEqual([]);
    }
  });

  it("rejects a moldBatch without a source URL", () => {
    const result = partSchema.safeParse(
      validBlade({
        moldBatches: [{ batchCode: "ABC123", note: "runs slightly heavier" }],
      }),
    );
    expect(result.success).toBe(false);
  });

  it("accepts a blade's playstyle — attack/defense/stamina/balance, the official four-way classification", () => {
    const result = partSchema.safeParse(validBlade({ playstyle: "balance" }));
    expect(result.success).toBe(true);
  });

  it("rejects a playstyle outside the official four values", () => {
    const result = partSchema.safeParse(validBlade({ playstyle: "speed" }));
    expect(result.success).toBe(false);
  });

  it("accepts a bit's playstyle — bits carry the same four-way classification as blades", () => {
    const result = partSchema.safeParse(validBit({ playstyle: "attack" }));
    expect(result.success).toBe(true);
  });

  it("playstyle is optional — a handful of parts never matched an official record", () => {
    const result = partSchema.safeParse(validBlade());
    expect(result.success).toBe(true);
  });

  it("accepts a ratchet's height, parsed from its own name (e.g. \"3-60\" -> 60)", () => {
    const result = partSchema.safeParse(validRatchet({ height: 60 }));
    expect(result.success).toBe(true);
  });

  it("rejects a non-positive ratchet height", () => {
    const result = partSchema.safeParse(validRatchet({ height: 0 }));
    expect(result.success).toBe(false);
  });

  it("rejects a ratchet with height omitted — every real ratchet name encodes one", () => {
    const withoutHeight = {
      id: "3-60",
      type: "ratchet",
      nameEn: "3-60",
      generation: "X",
      stats: { attack: 15, defense: 9, stamina: 6 },
      releaseAt: "2022-05-10",
    };
    const result = partSchema.safeParse(withoutHeight);
    expect(result.success).toBe(false);
  });
});

describe("partsFileSchema", () => {
  it("rejects duplicate ids across the whole seed file", () => {
    const result = partsFileSchema.safeParse([validBlade({ id: "DUP" }), validBit({ id: "DUP" })]);
    expect(result.success).toBe(false);
  });

  it("accepts a file with distinct ids", () => {
    const result = partsFileSchema.safeParse([validBlade(), validBit()]);
    expect(result.success).toBe(true);
  });
});
