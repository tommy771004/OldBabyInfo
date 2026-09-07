import { z } from "zod";
import { partsFileSchema, type Part } from "../parts/schema.ts";
import type { AttachedMoldBatches } from "./extract.ts";

const text = z.string().trim().min(1);
const sourceUrl = z.url().refine((value) => {
  const url = new URL(value);
  return ["https:", "http:"].includes(url.protocol) && !url.username && !url.password;
}, "Source must be an HTTP(S) URL without credentials");
const weightRange = z.strictObject({ min: z.number().positive(), max: z.number().positive() })
  .refine((value) => value.min <= value.max, "Weight range min must not exceed max");

const reviewFields = {
  partId: text,
  batchCode: text,
  note: text,
  sourceUrl,
  sourceExcerpt: text,
  capturedAt: z.iso.datetime(),
  attributionStatus: z.enum(["attributed", "unattributed"]),
  weightGrams: weightRange.optional(),
};

export const moldBatchReviewSchema = z.discriminatedUnion("decision", [
  z.strictObject({ ...reviewFields, decision: z.literal("pending") }),
  z.strictObject({
    ...reviewFields,
    decision: z.literal("approved"),
    reviewedBy: text,
    reviewedAt: z.iso.datetime(),
  }),
  z.strictObject({
    ...reviewFields,
    decision: z.literal("rejected"),
    reviewedBy: text,
    reviewedAt: z.iso.datetime(),
  }),
]);
export const moldBatchReviewFileSchema = z.array(moldBatchReviewSchema);
export type MoldBatchReview = z.infer<typeof moldBatchReviewSchema>;
type Batch = Part["moldBatches"][number];

/** Consensus is not human approval. Every freshly extracted row stays pending. */
export function createMoldBatchReviews(
  matched: AttachedMoldBatches["matched"],
  source: { url: string; excerpt: string; capturedAt: string },
): MoldBatchReview[] {
  return moldBatchReviewFileSchema.parse(matched.map(({ part, candidate }) => ({
    partId: part.id,
    batchCode: candidate.batchCode,
    note: candidate.note,
    sourceUrl: source.url,
    sourceExcerpt: candidate.sourceExcerpt ?? source.excerpt,
    capturedAt: source.capturedAt,
    // The acquisition URL can be a Discovery Source. Only human source review
    // may promote it to attributed; extraction must not invent that backing.
    attributionStatus: "unattributed",
    ...(candidate.weightGrams ? { weightGrams: candidate.weightGrams } : {}),
    decision: "pending",
  })));
}

function signature(batch: Batch): string {
  return JSON.stringify({
    note: batch.note,
    sourceExcerpt: batch.sourceExcerpt,
    capturedAt: batch.capturedAt,
    attributionStatus: batch.attributionStatus,
    weightMin: batch.weightGrams?.min,
    weightMax: batch.weightGrams?.max,
  });
}

/**
 * Additive merge only. A changed judgment from the same source and batch needs
 * a separate reviewed correction, not a last-writer-wins replacement. Different
 * sources remain separate so their disagreement is not silently averaged away.
 * Validate the whole proposal before returning; never mutate the caller's Parts.
 */
export function mergeReviewedMoldBatches(parts: Part[], input: unknown) {
  partsFileSchema.parse(parts);
  const reviews = moldBatchReviewFileSchema.parse(input);
  const byId = new Map(parts.map((part) => [part.id, part]));
  let added = 0;
  let unchanged = 0;

  for (const review of reviews) {
    if (review.decision !== "approved") continue;
    const part = byId.get(review.partId);
    if (!part) throw new Error(`Unknown Part id: ${review.partId}; do not match by name or guess`);
    const batch: Batch = {
      batchCode: review.batchCode,
      note: review.note,
      sourceUrl: review.sourceUrl,
      sourceExcerpt: review.sourceExcerpt,
      capturedAt: review.capturedAt,
      attributionStatus: review.attributionStatus,
      ...(review.weightGrams ? { weightGrams: review.weightGrams } : {}),
    };
    // Validate without reserializing unrelated fields, but honor the schema's
    // default when the raw JSON omits this optional-on-input array.
    const batches = part.moldBatches ?? [];
    const existing = batches.filter((entry) =>
      entry.batchCode === batch.batchCode && entry.sourceUrl === batch.sourceUrl,
    );
    if (existing.length > 0) {
      if (existing.some((entry) => signature(entry) !== signature(batch))) {
        throw new Error(`Conflicting Mold Batch: ${review.partId} / ${review.batchCode} / ${review.sourceUrl}`);
      }
      unchanged++;
      continue;
    }
    byId.set(part.id, { ...part, moldBatches: [...batches, batch] } as Part);
    added++;
  }

  const merged = parts.map((part) => byId.get(part.id)!);
  partsFileSchema.parse(merged);
  return {
    parts: merged,
    added,
    unchanged,
    pending: reviews.filter((review) => review.decision === "pending").length,
    rejected: reviews.filter((review) => review.decision === "rejected").length,
  };
}
