import type { GenerationCatalogRecord } from "./schema.ts";

/**
 * Which records a record points at, resolved once for a whole record list.
 *
 * `/parts` prints a "related" line on every row, and sorting reads every
 * row's facts too. Answering "which Beyblades use this Part" by scanning the
 * whole Catalog per row made one sorted page cost N² — about 2,000 records
 * scanned per row, per request. The Catalog is static repo JSON (ADR-0001),
 * so the answer never changes between requests: build the index once and
 * look it up.
 *
 * Every list keeps the input order, so the result is exactly what the
 * per-row scan returned.
 */
export interface CatalogRelations {
  /** Complete Beyblades that list this Part among their components, matched
   *  by record id or by the same Part kind and name. */
  beybladesUsing(record: GenerationCatalogRecord): GenerationCatalogRecord[];
  /** A Release's product, then what the Release contains. */
  releaseRelated(record: GenerationCatalogRecord): GenerationCatalogRecord[];
}

/** A record with no Part kind (`null`) maps to "", which no component can
 *  carry — the schema requires a component's kind to be non-empty. */
function componentKey(partType: string | null, name: string): string {
  return `${partType ?? ""}\u0000${name}`;
}

export function buildCatalogRelations(records: GenerationCatalogRecord[]): CatalogRelations {
  const position = new Map<GenerationCatalogRecord, number>();
  const byId = new Map<string, GenerationCatalogRecord[]>();
  const usersById = new Map<string, GenerationCatalogRecord[]>();
  const usersByKindAndName = new Map<string, GenerationCatalogRecord[]>();

  const push = (map: Map<string, GenerationCatalogRecord[]>, key: string, record: GenerationCatalogRecord) => {
    const list = map.get(key);
    if (!list) map.set(key, [record]);
    else if (list[list.length - 1] !== record) list.push(record);
  };

  records.forEach((record, index) => {
    position.set(record, index);
    push(byId, record.id, record);
    if (record.kind !== "beyblade") return;
    for (const component of record.components) {
      if (component.recordId) push(usersById, component.recordId, record);
      push(usersByKindAndName, componentKey(component.partType, component.name), record);
    }
  });

  return {
    beybladesUsing(record) {
      const byRecordId = usersById.get(record.id) ?? [];
      const byKindAndName = usersByKindAndName.get(componentKey(record.partType, record.name)) ?? [];
      if (byKindAndName.length === 0) return byRecordId;
      if (byRecordId.length === 0) return byKindAndName;
      return [...new Set([...byRecordId, ...byKindAndName])]
        .sort((left, right) => position.get(left)! - position.get(right)!);
    },
    releaseRelated(record) {
      return [
        ...(record.releaseOf ? byId.get(record.releaseOf) ?? [] : []),
        ...(record.containsRecordIds ?? []).flatMap((id) => byId.get(id) ?? []),
      ];
    },
  };
}
