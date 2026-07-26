import { extractWithConsensus, type CallModel, type ConsensusOutcome } from "../extraction.ts";
import { moldBatchCandidateListSchema, type MoldBatchCandidate } from "./schema.ts";
import { matchPartByName } from "./match-part.ts";
import type { Part } from "../parts/schema.ts";

/**
 * One prose article can discuss several batch codes at once (ticket 35) —
 * the model is asked to return the whole list it found as one JSON array,
 * so one article maps to one extractWithConsensus call, not one per code.
 */
export async function extractMoldBatchesFromArticle(
  sourceUrl: string,
  models: [string, string],
  callModel: CallModel,
): Promise<ConsensusOutcome<MoldBatchCandidate[]>> {
  return extractWithConsensus({
    models,
    sourceUrl,
    callModel,
    validate: (value) => moldBatchCandidateListSchema.parse(value),
  });
}

export interface AttachedMoldBatches {
  matched: { part: Part; candidate: MoldBatchCandidate }[];
  unmatched: MoldBatchCandidate[];
}

/**
 * Ticket 35: "與 Part 建立關聯；對不上者記錄而非猜測" — every candidate
 * ends up in exactly one bucket, never silently dropped.
 */
export function attachToParts(candidates: MoldBatchCandidate[], allParts: Part[]): AttachedMoldBatches {
  const matched: AttachedMoldBatches["matched"] = [];
  const unmatched: MoldBatchCandidate[] = [];

  for (const candidate of candidates) {
    const part = matchPartByName(candidate.partNameRaw, allParts);
    if (part) {
      matched.push({ part, candidate });
    } else {
      unmatched.push(candidate);
    }
  }

  return { matched, unmatched };
}
