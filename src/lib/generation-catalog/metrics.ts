import type { GenerationCatalogRecord, GenerationId } from "./schema.ts";
import { serializedCatalogPayloadBytes } from "./payload.ts";

type EntityKind = GenerationCatalogRecord["kind"];

export interface GenerationCatalogSizeBucket {
  records: number;
  serializedBytes: number;
  byKind: Record<EntityKind, number>;
}

export interface GenerationCatalogSizeReport {
  records: number;
  serializedBytes: number;
  byGeneration: Record<GenerationId, GenerationCatalogSizeBucket>;
}

function emptyKindCounts(): Record<EntityKind, number> {
  return { beyblade: 0, part: 0, release: 0, equipment: 0 };
}

export function measureGenerationCatalogSize(
  records: GenerationCatalogRecord[],
): GenerationCatalogSizeReport {
  const accepted = records.filter((record) =>
    record.publicationStatus === "accepted" && record.verificationStatus !== "needs_review",
  );
  const byGeneration = Object.fromEntries(
    (["bakuten_shoot", "metal_fight", "burst", "x"] as const).map((generationId) => {
      const generationRecords = accepted.filter((record) => record.generationId === generationId);
      const byKind = emptyKindCounts();
      for (const record of generationRecords) byKind[record.kind] += 1;
      return [generationId, {
        records: generationRecords.length,
        serializedBytes: serializedCatalogPayloadBytes(generationRecords),
        byKind,
      } satisfies GenerationCatalogSizeBucket];
    }),
  ) as Record<GenerationId, GenerationCatalogSizeBucket>;

  return {
    records: accepted.length,
    serializedBytes: serializedCatalogPayloadBytes(accepted),
    byGeneration,
  };
}
