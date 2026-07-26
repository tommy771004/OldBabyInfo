import type { GenerationCatalogRecord, GenerationId } from "./schema.ts";

export interface GenerationCatalogSearchFilters {
  generationId?: GenerationId;
  system?: string;
  kind?: GenerationCatalogRecord["kind"];
  partType?: string;
}

function normalizeSearchText(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/\p{Diacritic}/gu, "")
    .toLocaleLowerCase()
    .trim();
}

export function searchGenerationCatalog(
  records: GenerationCatalogRecord[],
  query: string,
  filters: GenerationCatalogSearchFilters = {},
): GenerationCatalogRecord[] {
  const normalizedQuery = normalizeSearchText(query);

  return records.filter((record) => {
    if (record.publicationStatus !== "accepted" || record.verificationStatus === "needs_review") {
      return false;
    }
    if (filters.generationId && record.generationId !== filters.generationId) return false;
    if (filters.system && record.system !== filters.system) return false;
    if (filters.kind && record.kind !== filters.kind) return false;
    if (filters.partType && record.partType !== filters.partType) return false;
    if (!normalizedQuery) return true;

    return [record.name, ...record.aliases]
      .some((value) => normalizeSearchText(value).includes(normalizedQuery));
  });
}
