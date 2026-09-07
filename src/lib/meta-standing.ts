/**
 * Meta Standing computation (ticket 33): objective stats
 * computed from real Event results, never a subjective tier label.
 *
 * This module is pure computation over a `ComboAppearance[]` — it does
 * NOT read `Event.results` directly. `Event.results.topFour` (schema.ts)
 * is a flat list of strings with no per-entrant Combo attribution, and
 * the actual real usage data found in the source review (1,215 real loadout
 * records, HackMD's "陀螺賽場統計2025" sheet) has never been ingested
 * into the accepted dataset yet. The offline review importer now supplies
 * validated records through combo-appearances-repository.ts; real observations
 * still require source review. Unknown placement never means a loss.
 */

/** Combo identity (ticket 33: "同一性判準") — the exact (Blade, Ratchet,
 *  Bit) id triple. A Stat Edition difference within the same three named
 *  parts is NOT a different Combo for this purpose: a player is choosing
 *  three parts, not a specific historical SKU of them (see ADR-0007's
 *  Stat Edition vs Mold Batch split). */
export function comboKeyOf(bladeId: string, ratchetId: string, bitId: string): string {
  return `${bladeId}|${ratchetId}|${bitId}`;
}

export function parseComboKey(key: string): { bladeId: string; ratchetId: string; bitId: string } {
  const [bladeId, ratchetId, bitId, ...extra] = key.split("|");
  if (!bladeId || !ratchetId || !bitId || extra.length > 0) {
    throw new Error(`Malformed Combo key: ${key}`);
  }
  return { bladeId, ratchetId, bitId };
}

// `entrant` means a known finish outside the top eight; absent results are unknown.
export type Placement = "champion" | "top8" | "entrant" | "unknown";

export interface ComboAppearance {
  comboKey: string;
  eventId: string;
  /** ISO date of the Event this appearance happened at — drives the
   *  reported statistical period (ticket 33: "統計期間的界定"). */
  eventDate: string;
  placement: Placement;
}

/** Rate-based fields (top-8 rate, champion count) need enough of THIS
 *  combo's own appearances to mean anything — the source review found n=4
 *  for the whole of 2025 for full standings, "完全撐不住統計意義". Usage
 *  rate doesn't need this gate: it's backed by the total field size, which
 *  the same review found "紮實" (1,215 real records) independent of any one
 *  Combo's own count. */
const DEFAULT_MIN_SAMPLE_SIZE = 10;

export type RateField =
  | { status: "computed"; value: number }
  | { status: "insufficient_data" };

export interface ComboMetaStanding {
  comboKey: string;
  /** This Combo's own appearance count — the Sample Size ticket 33
   *  requires on every result, gating or not. */
  sampleSize: number;
  /** Share of the whole field's appearances — ticket 33's "前八強佔比的
   *  分母" decision: usage rate's denominator is total appearances across
   *  ALL Combos in the period, not just this one's. */
  usageRate: number;
  /** Top-8 finishes ÷ this Combo's own appearances — gated by sampleSize. */
  top8Rate: RateField;
  /** Raw count of first-place finishes — also gated by sampleSize; an
   *  un-gated "1 championship" from a single appearance would read as
   *  meaningful when it isn't. */
  championCount: RateField;
  periodStart: string | null;
  periodEnd: string | null;
}

export function computeMetaStandings(
  appearances: ComboAppearance[],
  { minSampleSize = DEFAULT_MIN_SAMPLE_SIZE }: { minSampleSize?: number } = {},
): ComboMetaStanding[] {
  const totalAppearances = appearances.length;
  const dates = appearances.map((a) => a.eventDate).sort();
  const periodStart = dates[0] ?? null;
  const periodEnd = dates[dates.length - 1] ?? null;

  const byCombo = new Map<string, ComboAppearance[]>();
  for (const appearance of appearances) {
    const group = byCombo.get(appearance.comboKey) ?? [];
    group.push(appearance);
    byCombo.set(appearance.comboKey, group);
  }

  return [...byCombo.entries()].map(([comboKey, group]) => {
    const sampleSize = group.length;
    const championCount = group.filter((a) => a.placement === "champion").length;
    const top8Count = group.filter((a) => a.placement === "champion" || a.placement === "top8").length;
    const enoughSample = sampleSize >= minSampleSize && group.every((row) => row.placement !== "unknown");

    return {
      comboKey,
      sampleSize,
      usageRate: totalAppearances > 0 ? sampleSize / totalAppearances : 0,
      top8Rate: enoughSample
        ? { status: "computed", value: top8Count / sampleSize }
        : { status: "insufficient_data" },
      championCount: enoughSample
        ? { status: "computed", value: championCount }
        : { status: "insufficient_data" },
      periodStart,
      periodEnd,
    };
  });
}
