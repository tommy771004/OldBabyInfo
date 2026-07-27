import type { Part } from "./schema.ts";

export interface WeightRange {
  min: number;
  max: number;
}

/**
 * A Part's weight is a *range*, not a number: no official source publishes a
 * per-Part gram figure (checked against both BeyBrew feeds — neither carries
 * one), and what players actually measure varies by production run. That is
 * exactly the Mold Batch concept in CONTEXT.md, so the range is the envelope
 * of every batch weight recorded for the Part rather than a spec of its own.
 *
 * A Part with no weighed batch has no range — it reads "—", never 0.
 */
export function weightRangeOf(part: Part): WeightRange | undefined {
  const weighed = part.moldBatches.flatMap((batch) => batch.weightGrams ? [batch.weightGrams] : []);
  if (weighed.length === 0) return undefined;

  return {
    min: Math.min(...weighed.map((range) => range.min)),
    max: Math.max(...weighed.map((range) => range.max)),
  };
}

/** Sorting a range needs one number; the midpoint keeps a tight heavy range
 *  ahead of a wide light one, which neither bound does on its own. */
export function weightSortValueOf(part: Part): number | undefined {
  const range = weightRangeOf(part);
  return range ? (range.min + range.max) / 2 : undefined;
}

export function formatWeightRange(range: WeightRange): string {
  return range.min === range.max
    ? `${format(range.min)} g`
    : `${format(range.min)}–${format(range.max)} g`;
}

function format(grams: number): string {
  return Number.isInteger(grams) ? String(grams) : grams.toFixed(1);
}
