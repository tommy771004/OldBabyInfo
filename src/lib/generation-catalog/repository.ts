import catalogJson from "../../../data/generation-catalog.json" with { type: "json" };
import needsReviewJson from "../../../data/generation-catalog-needs-review.json" with { type: "json" };
import {
  generationCatalogSnapshotSchema,
  type GenerationCatalogRecord,
  type GenerationCatalogSnapshot,
  type GenerationId,
} from "./schema.ts";

const catalog = generationCatalogSnapshotSchema.parse(catalogJson);
const needsReview = generationCatalogSnapshotSchema.parse(needsReviewJson);

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
