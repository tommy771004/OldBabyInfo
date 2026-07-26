import type { Part } from "../parts/schema.ts";
import type { GenerationCatalogRecord } from "./schema.ts";

export interface XCatalogCrosswalkMatch {
  catalogRecordId: string;
  legacyPartId: string;
}

export interface XCatalogCrosswalkReview {
  catalogRecordId: string;
  reason: "ambiguous" | "unmatched";
}

export interface XCatalogCrosswalk {
  matches: XCatalogCrosswalkMatch[];
  needsReview: XCatalogCrosswalkReview[];
}

function normalize(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/\p{Diacritic}/gu, "")
    .toLocaleLowerCase()
    .replace(/[^\p{Letter}\p{Number}]+/gu, "");
}

function legacyLabels(part: Part): string[] {
  return [part.nameEn, part.nameJa, part.nameZhTw, ...part.aliases].filter(
    (value): value is string => Boolean(value),
  );
}

export function buildXCatalogCrosswalk(
  catalogRecords: GenerationCatalogRecord[],
  legacyParts: Part[],
): XCatalogCrosswalk {
  const matches: XCatalogCrosswalkMatch[] = [];
  const needsReview: XCatalogCrosswalkReview[] = [];
  const xParts = catalogRecords.filter((record) =>
    record.generationId === "x" &&
    record.kind === "part" &&
    (record.partType === "blade" || record.partType === "ratchet" || record.partType === "bit") &&
    record.publicationStatus === "accepted",
  );

  for (const record of xParts) {
    const queryNames = [record.name, ...record.aliases].map(normalize);
    const candidates = legacyParts.filter((part) =>
      part.type === record.partType &&
      legacyLabels(part).some((label) => queryNames.includes(normalize(label))),
    );
    const uniqueCandidates = [...new Map(candidates.map((part) => [part.id, part])).values()];
    if (uniqueCandidates.length === 1) {
      matches.push({ catalogRecordId: record.id, legacyPartId: uniqueCandidates[0]!.id });
    } else {
      needsReview.push({
        catalogRecordId: record.id,
        reason: uniqueCandidates.length > 1 ? "ambiguous" : "unmatched",
      });
    }
  }

  return {
    matches: matches.sort((left, right) => left.catalogRecordId.localeCompare(right.catalogRecordId)),
    needsReview: needsReview.sort((left, right) => left.catalogRecordId.localeCompare(right.catalogRecordId)),
  };
}
