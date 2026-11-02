import type { GenerationCatalogRecord } from "./schema.ts";

const MAX_GENERATION_PAYLOAD_BYTES = 650_000;

export function getCatalogPayloadBudget(): number {
  return MAX_GENERATION_PAYLOAD_BYTES;
}

export function serializedCatalogPayloadBytes(records: GenerationCatalogRecord[]): number {
  return new TextEncoder().encode(JSON.stringify(records)).byteLength;
}
