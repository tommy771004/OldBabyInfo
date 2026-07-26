import {
  generationCatalogRecordSchema,
  generationCatalogSnapshotSchema,
  type GenerationCatalogRecord,
  type GenerationCatalogSnapshot,
  type GenerationSource,
} from "./schema.ts";

export interface GenerationCatalogRefreshSource {
  source: GenerationSource;
  records: GenerationCatalogRecord[];
  skippedRecordIds?: string[];
}

export interface GenerationCatalogDiff {
  added: string[];
  changed: string[];
  removed: string[];
  skipped: string[];
  needsReview: string[];
}

export interface GenerationCatalogRefreshSuccess {
  status: "updated" | "unchanged";
  accepted: GenerationCatalogSnapshot;
  needsReview: GenerationCatalogSnapshot;
  diff: GenerationCatalogDiff;
}

export interface GenerationCatalogRefreshFailure {
  status: "failed";
  accepted: GenerationCatalogSnapshot;
  needsReview: GenerationCatalogSnapshot;
  error: string;
}

export type GenerationCatalogRefreshResult =
  | GenerationCatalogRefreshSuccess
  | GenerationCatalogRefreshFailure;

type AcceptedVerification = Extract<
  GenerationCatalogRecord["verificationStatus"],
  "officially_verified" | "official_app_derived" | "community_sourced"
>;

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function signatureOf(record: GenerationCatalogRecord): string {
  return JSON.stringify(record);
}

function sortRecords(records: GenerationCatalogRecord[]): GenerationCatalogRecord[] {
  return [...records].sort((left, right) => left.id.localeCompare(right.id));
}

function diffRecords(
  previous: GenerationCatalogRecord[],
  incoming: GenerationCatalogRecord[],
  skipped: string[],
  needsReview: string[],
): GenerationCatalogDiff {
  const previousById = new Map(previous.map((record) => [record.id, record]));
  const incomingById = new Map(incoming.map((record) => [record.id, record]));
  const added: string[] = [];
  const changed: string[] = [];
  const removed: string[] = [];

  for (const record of incoming) {
    const previousRecord = previousById.get(record.id);
    if (!previousRecord) added.push(record.id);
    else if (signatureOf(previousRecord) !== signatureOf(record)) changed.push(record.id);
  }
  for (const record of previous) {
    if (!incomingById.has(record.id)) removed.push(record.id);
  }

  return {
    added: added.sort(),
    changed: changed.sort(),
    removed: removed.sort(),
    skipped: [...new Set(skipped)].sort(),
    needsReview: [...new Set(needsReview)].sort(),
  };
}

function hasChanges(diff: GenerationCatalogDiff): boolean {
  return Object.values(diff).some((items) => items.length > 0);
}

function markConflict(record: GenerationCatalogRecord): GenerationCatalogRecord {
  return {
    ...record,
    verificationStatus: "needs_review",
    publicationStatus: "needs_review",
  };
}

function buildSnapshots(
  previousAccepted: GenerationCatalogSnapshot,
  capturedAt: string,
  sources: GenerationCatalogRefreshSource[],
  acceptedRecords: GenerationCatalogRecord[],
  reviewRecords: GenerationCatalogRecord[],
) {
  const base = {
    schemaVersion: 1 as const,
    capturedAt,
    sources: sources.map(({ source }) => source),
    generations: previousAccepted.generations,
    systems: previousAccepted.systems,
  };
  return {
    accepted: generationCatalogSnapshotSchema.parse({ ...base, records: sortRecords(acceptedRecords) }),
    needsReview: generationCatalogSnapshotSchema.parse({ ...base, records: sortRecords(reviewRecords) }),
  };
}

export async function refreshGenerationCatalog(
  previousAccepted: GenerationCatalogSnapshot,
  previousNeedsReview: GenerationCatalogSnapshot,
  load: () => Promise<GenerationCatalogRefreshSource[]>,
  capturedAt = new Date().toISOString(),
): Promise<GenerationCatalogRefreshResult> {
  try {
    const sources = await load();
    if (sources.length === 0) throw new Error("No catalog sources returned");
    for (const source of sources) {
      if (source.records.length === 0) throw new Error(`Source ${source.source.id} returned an empty response`);
    }

    const sourceIds = new Set(sources.map(({ source }) => source.id));
    const incomingRecords = sources.flatMap(({ records }) => records).map((record) => {
      const parsed = generationCatalogRecordSchema.parse(record);
      if (!sourceIds.has(parsed.sourceId)) {
        throw new Error(`Record ${parsed.id} references an unreported source ${parsed.sourceId}`);
      }
      return parsed;
    });
    const recordsById = new Map<string, GenerationCatalogRecord[]>();
    for (const record of incomingRecords) {
      const group = recordsById.get(record.id) ?? [];
      group.push(record);
      recordsById.set(record.id, group);
    }

    const accepted: GenerationCatalogRecord[] = [];
    const review: GenerationCatalogRecord[] = [];
    const conflictIds: string[] = [];
    for (const id of [...recordsById.keys()].sort()) {
      const variants = recordsById.get(id)!;
      const unique = [...new Map(variants.map((record) => [signatureOf(record), record])).values()]
        .sort((left, right) => signatureOf(left).localeCompare(signatureOf(right)));
      const candidate = unique[0]!;
      if (unique.length > 1) {
        conflictIds.push(id);
        review.push(markConflict(candidate));
      } else if (candidate.publicationStatus === "accepted" && candidate.verificationStatus !== "needs_review") {
        accepted.push(candidate);
      } else {
        review.push(candidate);
      }
    }

    const skipped = sources.flatMap(({ skippedRecordIds = [] }) => skippedRecordIds);
    const snapshots = buildSnapshots(previousAccepted, capturedAt, sources, accepted, review);
    const diff = diffRecords(previousAccepted.records, snapshots.accepted.records, skipped, [
      ...review.map((record) => record.id),
      ...conflictIds,
    ]);
    return {
      status: hasChanges(diff) ? "updated" : "unchanged",
      ...snapshots,
      diff,
    };
  } catch (error) {
    return {
      status: "failed",
      accepted: previousAccepted,
      needsReview: previousNeedsReview,
      error: messageOf(error),
    };
  }
}

export function promoteNeedsReviewRecord(
  acceptedSnapshot: GenerationCatalogSnapshot,
  needsReviewSnapshot: GenerationCatalogSnapshot,
  recordId: string,
  verificationStatus: AcceptedVerification,
): { accepted: GenerationCatalogSnapshot; needsReview: GenerationCatalogSnapshot } {
  const candidate = needsReviewSnapshot.records.find((record) => record.id === recordId);
  if (!candidate) throw new Error(`Needs Review record not found: ${recordId}`);
  if (acceptedSnapshot.records.some((record) => record.id === recordId)) {
    throw new Error(`Record already accepted: ${recordId}`);
  }
  const promoted = {
    ...candidate,
    verificationStatus,
    publicationStatus: "accepted" as const,
  };
  return {
    accepted: generationCatalogSnapshotSchema.parse({
      ...acceptedSnapshot,
      records: sortRecords([...acceptedSnapshot.records, promoted]),
    }),
    needsReview: generationCatalogSnapshotSchema.parse({
      ...needsReviewSnapshot,
      records: needsReviewSnapshot.records.filter((record) => record.id !== recordId),
    }),
  };
}
