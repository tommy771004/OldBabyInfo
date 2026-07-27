import type { GenerationCatalogRecord, GenerationSystem } from "./schema.ts";

export interface CatalogTab {
  kind: GenerationCatalogRecord["kind"];
  partType?: string;
  count: number;
}

const KIND_ORDER: GenerationCatalogRecord["kind"][] = ["beyblade", "part", "release", "equipment"];

/**
 * The Part kinds of a Generation, in the order that Generation's own Systems
 * declare them — for X that is Blade, Ratchet, Bit (the assembly order in
 * CONTEXT.md) followed by the CX-only kinds, without this module having to
 * know a single Part kind by name. Anything a System never declared sorts in
 * at the end so a source addition still shows up.
 */
function partTypeOrder(systems: GenerationSystem[], present: Set<string>): string[] {
  const declared: string[] = [];
  for (const system of systems) {
    for (const partType of system.partTypes) {
      if (present.has(partType) && !declared.includes(partType)) declared.push(partType);
    }
  }
  const undeclared = [...present].filter((partType) => !declared.includes(partType)).sort();
  return [...declared, ...undeclared];
}

/**
 * One tab per category a reader would browse: complete Beyblades, then each
 * Part kind, then Releases and Equipment. A category with nothing in it gets
 * no tab — an empty tab is a dead end, not information.
 */
export function catalogTabsOf(
  records: GenerationCatalogRecord[],
  systems: GenerationSystem[],
): CatalogTab[] {
  const byKind = new Map<GenerationCatalogRecord["kind"], number>();
  const byPartType = new Map<string, number>();

  for (const record of records) {
    byKind.set(record.kind, (byKind.get(record.kind) ?? 0) + 1);
    if (record.kind === "part" && record.partType) {
      byPartType.set(record.partType, (byPartType.get(record.partType) ?? 0) + 1);
    }
  }

  const tabs: CatalogTab[] = [];
  for (const kind of KIND_ORDER) {
    const count = byKind.get(kind) ?? 0;
    if (count === 0) continue;
    if (kind === "part") {
      // Every Part, then one tab per kind — a Generation whose Parts all share
      // one kind would otherwise get the same list twice.
      const partTypes = partTypeOrder(systems, new Set(byPartType.keys()));
      if (partTypes.length > 1) tabs.push({ kind: "part", count });
      for (const partType of partTypes) {
        tabs.push({ kind: "part", partType, count: byPartType.get(partType) ?? 0 });
      }
      continue;
    }
    tabs.push({ kind, count });
  }

  return tabs;
}

export function isTabSelected(
  tab: CatalogTab,
  selectedKind: string | undefined,
  selectedPartType: string | undefined,
): boolean {
  if (tab.kind !== selectedKind) return false;
  return tab.kind === "part" ? tab.partType === selectedPartType : true;
}
