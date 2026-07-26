/**
 * Reusable batch-write infrastructure (ticket 24) sitting on top of ticket
 * 20's extraction contract — the thing that actually loops 19/20 over many
 * real Parts/Events and lands the results in repo JSON. Tickets 32 and 35
 * are the real callers; this module has no domain knowledge of Parts or
 * Events itself, only of the shape ConsensusOutcome already guarantees.
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import type { ConsensusOutcome } from "./extraction.ts";

/**
 * The exact formatting generate-parts-seed.ts / generate-events-seed.ts
 * already use (`JSON.stringify(data, null, 2) + "\n"`) — matching it
 * exactly, not reinventing a key-sorting scheme, is what keeps diffs
 * reflecting only real changes: object literals in this codebase are
 * already built with a consistent field order, so plain JSON.stringify is
 * already stable run to run.
 */
export function stableJson(data: unknown): string {
  return JSON.stringify(data, null, 2) + "\n";
}

/**
 * A fixed delay between each item's extraction call — never after the
 * last one, since there's nothing left to wait for. This is the literal
 * rate control ticket 19's Comments flagged as needed once something
 * actually loops model calls across many real items, which is exactly
 * what this function is.
 */
export async function runRateLimited<TItem, TResult>(
  items: TItem[],
  fn: (item: TItem) => Promise<TResult>,
  delayMs: number,
): Promise<TResult[]> {
  const results: TResult[] = [];
  for (let i = 0; i < items.length; i++) {
    results.push(await fn(items[i]!));
    if (i < items.length - 1 && delayMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
  return results;
}

type Accepted<T> = Extract<ConsensusOutcome<T>, { status: "accepted" }>;
type NeedsReview<T> = Extract<ConsensusOutcome<T>, { status: "needs_review" }>;
type Rejected<T> = Extract<ConsensusOutcome<T>, { status: "rejected" }>;

export interface WriteBatchOptions<T> {
  outcomes: ConsensusOutcome<T>[];
  outputPath: string;
  /** Needs Review items never land in outputPath (CONTEXT.md: "必須經人工
   *  判斷才能發布") — a separate file is the clearest possible way to make
   *  them identifiable, short of not writing them anywhere at all. */
  needsReviewPath: string;
  /** Receives the full "accepted" outcomes — sourceExcerpt/sourceUrl/model
   *  included, not just the bare value — so a caller has to actively
   *  discard provenance to lose it; the infra never does that for them. */
  mergeAccepted: (accepted: Accepted<T>[]) => unknown;
  /** The actual abort gate. Throws on a structurally invalid merged
   *  result — that throw propagates out of writeBatch uncaught, so
   *  nothing below it (the writeFileSync calls) ever runs. A single
   *  rejected or needs-review item is never fatal on its own; only a
   *  broken merged dataset is. */
  validateMerged: (merged: unknown) => unknown;
  dryRun: boolean;
}

export interface WriteBatchResult {
  written: boolean;
  acceptedCount: number;
  needsReviewCount: number;
  rejectedCount: number;
  /** Existing outputPath content, "" if the file doesn't exist yet. */
  before: string;
  /** What was (or, in dry-run, would be) written to outputPath. */
  after: string;
}

export function writeBatch<T>(opts: WriteBatchOptions<T>): WriteBatchResult {
  const accepted = opts.outcomes.filter((o): o is Accepted<T> => o.status === "accepted");
  const needsReview = opts.outcomes.filter((o): o is NeedsReview<T> => o.status === "needs_review");
  const rejected = opts.outcomes.filter((o): o is Rejected<T> => o.status === "rejected");

  const merged = opts.mergeAccepted(accepted);
  // Throws on invalid input — deliberately not caught, see the option's own doc.
  const validated = opts.validateMerged(merged);

  const before = existsSync(opts.outputPath) ? readFileSync(opts.outputPath, "utf-8") : "";
  const after = stableJson(validated);

  if (!opts.dryRun) {
    writeFileSync(opts.outputPath, after);
    if (needsReview.length > 0) {
      writeFileSync(opts.needsReviewPath, stableJson(needsReview));
    }
  }

  return {
    written: !opts.dryRun,
    acceptedCount: accepted.length,
    needsReviewCount: needsReview.length,
    rejectedCount: rejected.length,
    before,
    after,
  };
}
