import type { GenerationCatalogRecord, GenerationId } from "./schema.ts";

const MAX_GENERATION_PAYLOAD_BYTES = 650_000;

export function getCatalogPayloadBudget(): number {
  return MAX_GENERATION_PAYLOAD_BYTES;
}

export function serializedCatalogPayloadBytes(records: GenerationCatalogRecord[]): number {
  return new TextEncoder().encode(JSON.stringify(records)).byteLength;
}

export function selectCatalogRecordsForPage(
  records: GenerationCatalogRecord[],
  generationId: GenerationId,
  searchAcrossGenerations: boolean,
): GenerationCatalogRecord[] {
  const accepted = records.filter((record) =>
    record.publicationStatus === "accepted" && record.verificationStatus !== "needs_review",
  );
  return searchAcrossGenerations
    ? accepted
    : accepted.filter((record) => record.generationId === generationId);
}
