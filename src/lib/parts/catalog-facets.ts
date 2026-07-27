import type { GenerationCatalogRecord } from "../generation-catalog/schema.ts";
import type { PartProjectionLookup } from "./catalog-part-rows.ts";
import { parseRatchetTeeth, ratchetTeethOf, ratchetTeethParam, type RatchetTeeth } from "./ratchet-spec.ts";
import type { Playstyle } from "./schema.ts";

/**
 * Which facets a Part kind can actually be filtered by.
 *
 * Modelled on how a player narrows a Part list — a Blade by how it plays, a
 * Ratchet by its physical spec — but every facet here is backed by real
 * source data (ADR-0010): `playstyle` is the official four-way
 * classification, and a Ratchet's teeth/height come off its own official
 * name. Facets we can't source (a Blade's spin direction, a Bit's tip
 * shape, per-Part weight) are deliberately absent rather than guessed.
 */
export type CatalogFacet = "playstyle" | "ratchetTeeth" | "ratchetHeight";

const FACETS_BY_PART_TYPE: Record<string, CatalogFacet[]> = {
  blade: ["playstyle"],
  main_blade: ["playstyle"],
  metal_blade: ["playstyle"],
  over_blade: ["playstyle"],
  bit: ["playstyle"],
  ratchet: ["ratchetTeeth", "ratchetHeight"],
};

export function facetsForPartType(partType: string | undefined): CatalogFacet[] {
  return partType ? FACETS_BY_PART_TYPE[partType] ?? [] : [];
}

export interface CatalogFacetState {
  playstyle?: Playstyle;
  teeth?: RatchetTeeth;
  height?: number;
}

export function parseCatalogFacetParams(
  params: Record<string, string | undefined>,
): CatalogFacetState {
  const playstyle = params.playstyle;
  const height = Number(params.height);

  return {
    playstyle: playstyle === "attack" || playstyle === "defense" || playstyle === "stamina" || playstyle === "balance"
      ? playstyle
      : undefined,
    teeth: parseRatchetTeeth(params.teeth),
    height: Number.isFinite(height) && height > 0 ? height : undefined,
  };
}

export function catalogFacetQuery(state: CatalogFacetState): Record<string, string> {
  const query: Record<string, string> = {};
  if (state.playstyle) query.playstyle = state.playstyle;
  if (state.teeth !== undefined) query.teeth = ratchetTeethParam(state.teeth);
  if (state.height !== undefined) query.height = String(state.height);
  return query;
}

/**
 * A facet reads through the X Part projection, so a Catalog record with no
 * projection (a colour variant, a Generation with no Stat data) can't answer
 * it — and drops out of a facet-filtered list rather than being shown as an
 * unclassified row among classified ones.
 */
export function filterCatalogRecordsByFacets(
  records: GenerationCatalogRecord[],
  projectionFor: PartProjectionLookup,
  state: CatalogFacetState,
): GenerationCatalogRecord[] {
  if (state.playstyle === undefined && state.teeth === undefined && state.height === undefined) {
    return records;
  }

  return records.filter((record) => {
    const part = projectionFor(record.id);
    if (!part) return false;

    if (state.playstyle !== undefined) {
      if (part.type === "ratchet" || part.playstyle !== state.playstyle) return false;
    }
    if (state.teeth !== undefined && ratchetTeethOf(part) !== state.teeth) return false;
    if (state.height !== undefined && (part.type !== "ratchet" || part.height !== state.height)) return false;

    return true;
  });
}

/** The facet values actually present in a list, so a filter row never offers
 *  a chip that would empty the page. */
export function availableFacetValues(
  records: GenerationCatalogRecord[],
  projectionFor: PartProjectionLookup,
): { playstyles: Playstyle[]; teeth: RatchetTeeth[]; heights: number[] } {
  const playstyles = new Set<Playstyle>();
  const teeth = new Set<RatchetTeeth>();
  const heights = new Set<number>();

  for (const record of records) {
    const part = projectionFor(record.id);
    if (!part) continue;
    if (part.type !== "ratchet" && part.playstyle) playstyles.add(part.playstyle);
    if (part.type === "ratchet") {
      const count = ratchetTeethOf(part);
      if (count !== undefined) teeth.add(count);
      heights.add(part.height);
    }
  }

  return {
    playstyles: (["attack", "defense", "stamina", "balance"] as const).filter((value) => playstyles.has(value)),
    teeth: [...teeth].sort(compareTeeth),
    heights: [...heights].sort((left, right) => left - right),
  };
}

function compareTeeth(left: RatchetTeeth, right: RatchetTeeth): number {
  if (left === "metal") return 1;
  if (right === "metal") return -1;
  return left - right;
}
