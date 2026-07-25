import { describe, expect, it } from "vitest";
import { buildStatEditions, type RawMasterDataEntry } from "./build-stat-editions";

/** Real MasterData.json defaultStatus shape — rotation/height/weight are
 *  present but irrelevant to stat comparison; dash/burst are the raw names
 *  for what this codebase calls xDash/burstResistance. */
function entry(overrides: Partial<RawMasterDataEntry> = {}): RawMasterDataEntry {
  return {
    model_name: "BX01_Test",
    group_id: "TEST",
    release_at: "2022-01-01T00:00:00.000Z",
    defaultStatus: {
      rotation: "right",
      attack: 10,
      defense: 10,
      stamina: 10,
      height: 0,
      dash: 0,
      burst: 0,
      weight: 0,
    },
    ...overrides,
  };
}

describe("buildStatEditions — three-stat parts (blade/ratchet)", () => {
  it("returns an empty array when every entry shares the canonical stats", () => {
    const entries = [
      entry({ defaultStatus: { attack: 55, defense: 25, stamina: 20 } }),
      entry({ defaultStatus: { attack: 55, defense: 25, stamina: 20 } }),
    ];
    expect(buildStatEditions(entries, { attack: 55, defense: 25, stamina: 20 }, "three")).toEqual([]);
  });

  it("captures a distinct stat-tuple as one edition, normalized and stripped of raw-only fields", () => {
    const entries = [
      entry({
        model_name: "BX01_DranSword3-60F",
        release_at: "2022-05-10T15:00:00.000Z",
        defaultStatus: { attack: 55, defense: 25, stamina: 20, height: 0, weight: 0 },
      }),
      entry({
        model_name: "BX07_DranSword3-60F",
        release_at: "2022-06-01T15:00:00.000Z",
        defaultStatus: { attack: 55, defense: 25, stamina: 20, height: 0, weight: 0 },
      }),
      entry({
        model_name: "BXC00_DranSword3-60F_gold",
        release_at: "2023-10-25T15:00:00.000Z",
        defaultStatus: { attack: 60, defense: 30, stamina: 25, height: 0, weight: 0 },
      }),
    ];

    const editions = buildStatEditions(entries, { attack: 60, defense: 30, stamina: 25 }, "three");

    expect(editions).toEqual([
      {
        label: "BX01_DranSword3-60F",
        releaseAt: "2022-05-10",
        stats: { attack: 55, defense: 25, stamina: 20 },
      },
    ]);
  });

  it("ignores entries with no release_at when picking the representative label", () => {
    const entries = [
      entry({ model_name: "NoDate", release_at: undefined, defaultStatus: { attack: 1, defense: 1, stamina: 1 } }),
      entry({ model_name: "HasDate", release_at: "2020-01-01T00:00:00.000Z", defaultStatus: { attack: 1, defense: 1, stamina: 1 } }),
    ];

    const editions = buildStatEditions(entries, { attack: 99, defense: 99, stamina: 99 }, "three");
    expect(editions).toEqual([
      { label: "HasDate", releaseAt: "2020-01-01", stats: { attack: 1, defense: 1, stamina: 1 } },
    ]);
  });

  it("ignores mode-change entries entirely — they are not stat editions", () => {
    const entries = [
      entry({ model_name: "Base", defaultStatus: { attack: 55, defense: 25, stamina: 20 } }),
      entry({
        model_name: "Base_ModeChange",
        defaultStatus: { attack: 20, defense: 55, stamina: 20 },
      }),
    ];

    expect(buildStatEditions(entries, { attack: 55, defense: 25, stamina: 20 }, "three")).toEqual([]);
  });
});

describe("buildStatEditions — five-stat parts (bit)", () => {
  it("renames raw dash/burst to xDash/burstResistance", () => {
    const entries = [
      entry({
        model_name: "OldF",
        release_at: "2021-01-01T00:00:00.000Z",
        defaultStatus: { attack: 40, defense: 15, stamina: 10, dash: 30, burst: 75 },
      }),
    ];

    const editions = buildStatEditions(
      entries,
      { attack: 40, defense: 15, stamina: 10, xDash: 35, burstResistance: 80 },
      "five",
    );

    expect(editions).toEqual([
      {
        label: "OldF",
        releaseAt: "2021-01-01",
        stats: { attack: 40, defense: 15, stamina: 10, xDash: 30, burstResistance: 75 },
      },
    ]);
  });
});
