/**
 * Extraction contract per ADR-0004: LLM output is a format conversion, never
 * a source of truth. This module is the boundary that enforces that.
 */
import { isDeepStrictEqual } from "node:util";

export type StructuredParseOutcome<T> =
  | { status: "accepted"; value: T }
  | { status: "rejected"; reason: string };

/**
 * Deterministic parsing for already-structured sources (JSON files, API
 * responses). Its signature has no model dependency at all — there is
 * nothing here that could call an LLM.
 */
export function parseStructuredExtraction<T>(
  data: unknown,
  validate: (value: unknown) => T,
): StructuredParseOutcome<T> {
  try {
    return { status: "accepted", value: validate(data) };
  } catch (err) {
    return {
      status: "rejected",
      reason: err instanceof Error ? err.message : String(err),
    };
  }
}

export interface ModelExtraction {
  value: unknown;
  sourceExcerpt: string;
}

export type CallModel = (model: string) => Promise<ModelExtraction>;

export interface ConsensusRequest<T> {
  /** Two models from different vendor families — see familyOf(). */
  models: [string, string];
  sourceUrl: string;
  callModel: CallModel;
  validate: (value: unknown) => T;
}

export type ConsensusOutcome<T> =
  | {
      status: "accepted";
      value: T;
      sourceExcerpt: string;
      sourceUrl: string;
      model: string;
    }
  | {
      status: "needs_review";
      reason: string;
      candidates: Array<{ model: string; value: unknown; sourceExcerpt: string }>;
    }
  | { status: "rejected"; reason: string };

function familyOf(model: string): string {
  return model.split("/")[0]!;
}

export async function extractWithConsensus<T>(
  request: ConsensusRequest<T>,
): Promise<ConsensusOutcome<T>> {
  const [modelA, modelB] = request.models;

  if (familyOf(modelA) === familyOf(modelB)) {
    throw new Error(
      `extractWithConsensus requires two different-family models, got two from "${familyOf(modelA)}"`,
    );
  }

  const [resultA, resultB] = await Promise.all([
    request.callModel(modelA),
    request.callModel(modelB),
  ]);

  if (!resultA.sourceExcerpt || !resultB.sourceExcerpt) {
    return { status: "rejected", reason: "missing source excerpt" };
  }

  if (!isDeepStrictEqual(resultA.value, resultB.value)) {
    return {
      status: "needs_review",
      reason: "models disagree",
      candidates: [
        { model: modelA, value: resultA.value, sourceExcerpt: resultA.sourceExcerpt },
        { model: modelB, value: resultB.value, sourceExcerpt: resultB.sourceExcerpt },
      ],
    };
  }

  try {
    const value = request.validate(resultA.value);
    return {
      status: "accepted",
      value,
      sourceExcerpt: resultA.sourceExcerpt,
      sourceUrl: request.sourceUrl,
      model: modelA,
    };
  } catch (err) {
    return {
      status: "rejected",
      reason: err instanceof Error ? err.message : String(err),
    };
  }
}
