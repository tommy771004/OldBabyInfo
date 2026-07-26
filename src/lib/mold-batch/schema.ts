import { z } from "zod";

/**
 * What one model call is asked to find in a prose article (ticket 35):
 * a batch code, the production-period note a community writer attached to
 * it, and whatever name the article itself used to refer to the Part —
 * matching that name to a real Part id is a separate step (match-part.ts),
 * not something the model is trusted to get right on its own.
 */
export const moldBatchCandidateSchema = z.object({
  partNameRaw: z.string().min(1),
  batchCode: z.string().min(1),
  note: z.string().min(1),
});

export const moldBatchCandidateListSchema = z.array(moldBatchCandidateSchema);

export type MoldBatchCandidate = z.infer<typeof moldBatchCandidateSchema>;
