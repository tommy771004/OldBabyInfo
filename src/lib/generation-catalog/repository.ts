import catalogJson from "../../../data/generation-catalog.json" with { type: "json" };
import needsReviewJson from "../../../data/generation-catalog-needs-review.json" with { type: "json" };
import {
  generationCatalogSnapshotSchema,
  type GenerationCatalogRecord,
  type GenerationCatalogSnapshot,
  type GenerationId,
} from "./schema.ts";
import { getAllParts } from "../parts/repository.ts";
import type { Part } from "../parts/schema.ts";
import { buildXCatalogCrosswalk } from "./legacy-x-bridge.ts";

const catalog = generationCatalogSnapshotSchema.parse(catalogJson);
const needsReview = generationCatalogSnapshotSchema.parse(needsReviewJson);
const legacyParts = getAllParts();
const legacyPartById = new Map(legacyParts.map((part) => [part.id, part] as const));
const legacyPartByCatalogRecordId = new Map(
  buildXCatalogCrosswalk(catalog.records, legacyParts).matches.map((match) => [
    match.catalogRecordId,
    legacyPartById.get(match.legacyPartId),
  ] as const),
);

export function getGenerationCatalogSnapshot(): GenerationCatalogSnapshot {
  return catalog;
}

export function getAllGenerationCatalogRecords(): GenerationCatalogRecord[] {
  return catalog.records;
}

export function getGenerationCatalogRecords(
  generationId: GenerationId,
): GenerationCatalogRecord[] {
  return catalog.records.filter((record) => record.generationId === generationId);
}

export function getGenerationCatalogNeedsReview(): GenerationCatalogRecord[] {
  return needsReview.records;
}

export function getLegacyPartForCatalogRecord(recordId: string): Part | undefined {
  return legacyPartByCatalogRecordId.get(recordId);
}
