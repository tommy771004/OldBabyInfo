import { partsFileSchema, type Part } from "../parts/schema.ts";

export interface OfficialSnapshot {
  sourceVersion: string;
  parts: Part[];
}

export interface OfficialPartDiff {
  added: string[];
  changed: string[];
  removed: string[];
}

export type OfficialRefreshResult =
  | {
      status: "updated" | "unchanged";
      sourceVersion: string;
      parts: Part[];
      diff: OfficialPartDiff;
    }
  | {
      status: "failed";
      parts: Part[];
      error: string;
    };

export type OfficialSnapshotLoader = () => Promise<OfficialSnapshot>;

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function sortParts(parts: Part[]): Part[] {
  return [...parts].sort((left, right) => left.id.localeCompare(right.id));
}

function signatureOf(part: Part): string {
  return JSON.stringify(part);
}

function diffParts(previous: Part[], incoming: Part[]): OfficialPartDiff {
  const previousById = new Map(previous.map((part) => [part.id, part]));
  const incomingById = new Map(incoming.map((part) => [part.id, part]));
  const added: string[] = [];
  const changed: string[] = [];
  const removed: string[] = [];

  for (const part of incoming) {
    const previousPart = previousById.get(part.id);
    if (!previousPart) {
      added.push(part.id);
    } else if (signatureOf(previousPart) !== signatureOf(part)) {
      changed.push(part.id);
    }
  }
  for (const part of previous) {
    if (!incomingById.has(part.id)) removed.push(part.id);
  }

  return {
    added: added.sort(),
    changed: changed.sort(),
    removed: removed.sort(),
  };
}

function isEmptyDiff(diff: OfficialPartDiff): boolean {
  return diff.added.length === 0 && diff.changed.length === 0 && diff.removed.length === 0;
}

export async function refreshOfficialParts(
  previous: Part[],
  load: OfficialSnapshotLoader,
): Promise<OfficialRefreshResult> {
  try {
    const snapshot = await load();
    const incoming = sortParts(partsFileSchema.parse(snapshot.parts));
    const prior = sortParts(partsFileSchema.parse(previous));
    const diff = diffParts(prior, incoming);

    return {
      status: isEmptyDiff(diff) ? "unchanged" : "updated",
      sourceVersion: snapshot.sourceVersion,
      parts: incoming,
      diff,
    };
  } catch (error) {
    return {
      status: "failed",
      parts: previous,
      error: messageOf(error),
    };
  }
}
