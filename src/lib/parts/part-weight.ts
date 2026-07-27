import type { Part } from "./schema.ts";

export interface WeightRange {
  min: number;
  max: number;
}

/**
 * A Part's weight comes from one of two places, and measured beats published.
 *
 * `moldBatches[].weightGrams` is what players actually put on a scale across
 * production runs, so when it exists the answer is the envelope of every
 * weighed batch — the spread is the point. Failing that, `part.weightGrams`
 * is the single figure a source states for the Part, shown as a range whose
 * ends coincide.
 *
 * A Part with neither has no weight — it reads "—", never 0.
 */
export function weightRangeOf(part: Part): WeightRange | undefined {
  const weighed = part.moldBatches.flatMap((batch) => batch.weightGrams ? [batch.weightGrams] : []);
  if (weighed.length > 0) {
    return {
      min: Math.min(...weighed.map((range) => range.min)),
      max: Math.max(...weighed.map((range) => range.max)),
    };
  }

  return part.weightGrams === undefined ? undefined : { min: part.weightGrams, max: part.weightGrams };
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
