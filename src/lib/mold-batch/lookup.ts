import type { Part } from "../parts/schema.ts";

export type MoldBatch = Part["moldBatches"][number];

export type MoldBatchLookupResult =
  | { kind: "empty-query" }
  | { kind: "no-matches"; query: string }
  | { kind: "matches"; matches: { part: Part; batch: MoldBatch }[] };

function normalizeBatchCode(value: string): string {
  return value.toLowerCase().replace(/\s+/g, "");
}

/**
 * Looks up the exact batch code recorded for a Part. Batch codes are not
 * treated as fuzzy search terms: a false positive would attach a physical
 * production claim to the wrong part.
 */
export function lookupMoldBatches(parts: Part[], query: string): MoldBatchLookupResult {
  const trimmedQuery = query.trim();
  const normalizedQuery = normalizeBatchCode(trimmedQuery);

  if (normalizedQuery.length === 0) return { kind: "empty-query" };

  const matches = parts.flatMap((part) =>
    part.moldBatches
      .filter((batch) => normalizeBatchCode(batch.batchCode) === normalizedQuery)
      .map((batch) => ({ part, batch })),
  );

  return matches.length > 0
    ? { kind: "matches", matches }
    : { kind: "no-matches", query: trimmedQuery };
}

export function getMoldBatchCoverage(parts: Part[]) {
  return {
    partsWithBatches: parts.filter((part) => part.moldBatches.length > 0).length,
    totalParts: parts.length,
    batchEntries: parts.reduce((total, part) => total + part.moldBatches.length, 0),
  };
}
