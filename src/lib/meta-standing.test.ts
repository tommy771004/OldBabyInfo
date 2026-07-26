import { describe, expect, it } from "vitest";
import {
  comboKeyOf,
  computeMetaStandings,
  parseComboKey,
  type ComboAppearance,
} from "./meta-standing.ts";

describe("comboKeyOf", () => {
  it("builds a stable key from the three part ids", () => {
    expect(comboKeyOf("DRANSWORD", "3-60", "FLAT")).toBe("DRANSWORD|3-60|FLAT");
  });

  it("treats the same three ids as the same Combo regardless of Stat Edition history", () => {
    // Same three named parts → same key, even though a real Blade might
    // have multiple Stat Editions behind the scenes (ADR-0007).
    expect(comboKeyOf("DRANSWORD", "3-60", "FLAT")).toBe(comboKeyOf("DRANSWORD", "3-60", "FLAT"));
  });
});

describe("parseComboKey", () => {
  it("round-trips with comboKeyOf", () => {
    const key = comboKeyOf("DRANSWORD", "3-60", "FLAT");
    expect(parseComboKey(key)).toEqual({
      bladeId: "DRANSWORD",
      ratchetId: "3-60",
      bitId: "FLAT",
    });
  });

  it("throws on a malformed key rather than silently returning partial data", () => {
    expect(() => parseComboKey("not-a-real-key")).toThrow("Malformed Combo key");
  });
});

function appearance(
  comboKey: string,
  placement: ComboAppearance["placement"],
  eventDate = "2025-06-01",
  eventId = "e1",
): ComboAppearance {
  return { comboKey, eventId, eventDate, placement };
}

describe("computeMetaStandings", () => {
  it("returns 'insufficient_data' for top8Rate/championCount below the sample threshold", () => {
    const appearances = [appearance("A", "champion"), appearance("A", "top8")];
    const [standing] = computeMetaStandings(appearances, { minSampleSize: 10 });
    expect(standing!.sampleSize).toBe(2);
    expect(standing!.top8Rate).toEqual({ status: "insufficient_data" });
    expect(standing!.championCount).toEqual({ status: "insufficient_data" });
  });

  it("computes real rates once sample size clears the threshold", () => {
    const appearances = Array.from({ length: 10 }, (_, i) =>
      appearance("A", i < 3 ? "champion" : i < 6 ? "top8" : "entrant"),
    );
    const [standing] = computeMetaStandings(appearances, { minSampleSize: 10 });
    expect(standing!.sampleSize).toBe(10);
    expect(standing!.top8Rate).toEqual({ status: "computed", value: 0.6 }); // 3 champion + 3 top8 = 6/10
    expect(standing!.championCount).toEqual({ status: "computed", value: 3 });
  });

  it("computes usageRate against the whole field, unaffected by this Combo's own sample gate", () => {
    // Combo A: 2 appearances (below the n=10 gate for top8/champion).
    // Combo B: 8 appearances. Total field = 10.
    const appearances = [
      appearance("A", "entrant"),
      appearance("A", "entrant"),
      ...Array.from({ length: 8 }, () => appearance("B", "entrant")),
    ];
    const standings = computeMetaStandings(appearances, { minSampleSize: 10 });
    const a = standings.find((s) => s.comboKey === "A")!;
    const b = standings.find((s) => s.comboKey === "B")!;
    expect(a.usageRate).toBeCloseTo(0.2, 5);
    expect(b.usageRate).toBeCloseTo(0.8, 5);
    // Usage rate is real even though A's own sample is too small to trust
    // its rate-based fields.
    expect(a.top8Rate).toEqual({ status: "insufficient_data" });
  });

  it("reports the real period spanned by the given appearances, not a hardcoded range", () => {
    const appearances = [
      appearance("A", "entrant", "2025-03-15"),
      appearance("A", "entrant", "2025-01-02"),
      appearance("A", "entrant", "2025-07-30"),
    ];
    const [standing] = computeMetaStandings(appearances);
    expect(standing!.periodStart).toBe("2025-01-02");
    expect(standing!.periodEnd).toBe("2025-07-30");
  });

  it("returns an empty list for no appearances, not an error", () => {
    expect(computeMetaStandings([])).toEqual([]);
  });

  it("groups appearances by Combo identity, not by event", () => {
    const appearances = [
      appearance("A", "entrant", "2025-01-01", "event-1"),
      appearance("A", "entrant", "2025-02-01", "event-2"),
      appearance("B", "entrant", "2025-01-01", "event-1"),
    ];
    const standings = computeMetaStandings(appearances);
    expect(standings).toHaveLength(2);
    expect(standings.find((s) => s.comboKey === "A")!.sampleSize).toBe(2);
  });
});
