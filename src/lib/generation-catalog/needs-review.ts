import needsReviewJson from "../../../data/generation-catalog-needs-review.json" with { type: "json" };
import { generationCatalogSnapshotSchema, type GenerationCatalogRecord } from "./schema.ts";
import { loadStaticData } from "../data/static-data.ts";

/**
 * The Needs Review snapshot: records held back from every public page until
 * someone verifies them. No route reads it — only tests and the scraper do —
 * so it lives outside `repository.ts`. Importing it from there put another
 * 219KB of JSON into every server bundle and parsed it on every cold start
 * for nothing.
 */
const needsReview = loadStaticData(generationCatalogSnapshotSchema, needsReviewJson);

export function getGenerationCatalogNeedsReview(): GenerationCatalogRecord[] {
  return needsReview.records;
}
