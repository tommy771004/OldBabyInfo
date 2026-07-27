import type { GenerationCatalogRecord } from "../generation-catalog/schema.ts";
import type { PartProjectionLookup } from "./catalog-part-rows.ts";
import { parseRatchetTeeth, ratchetTeethOf, ratchetTeethParam, type RatchetTeeth } from "./ratchet-spec.ts";
import type { Playstyle } from "./schema.ts";

/**
 * Which facets a Part kind can actually be filtered by.
 *
 * Modelled on how a player narrows a Part list — a Blade by how it plays and
 * which way it spins, a Bit by how it meets the floor, a Ratchet by its
 * physical spec. Every facet is backed by real source data (ADR-0010):
 * `playstyle` is the official four-way classification, a Ratchet's
 * teeth/height come off its own official name, and spin direction and Bit
 * shape are structured fields taken from Go-Shoot's Part database. Nothing
 * here is inferred from a photo or a name pattern.
 */
export type CatalogFacet = "playstyle" | "spinDirection" | "bitShape" | "ratchetTeeth" | "ratchetHeight";

const FACETS_BY_PART_TYPE: Record<string, CatalogFacet[]> = {
  blade: ["playstyle", "spinDirection"],
  main_blade: ["playstyle", "spinDirection"],
  metal_blade: ["playstyle", "spinDirection"],
  over_blade: ["playstyle", "spinDirection"],
  bit: ["playstyle", "bitShape"],
  ratchet: ["ratchetTeeth", "ratchetHeight"],
};

export function facetsForPartType(partType: string | undefined): CatalogFacet[] {
  return partType ? FACETS_BY_PART_TYPE[partType] ?? [] : [];
}

export type SpinDirection = "right" | "left";
export type BitShape = "flat" | "round" | "sharp" | "multi";

const SPIN_DIRECTIONS: SpinDirection[] = ["right", "left"];
const BIT_SHAPES: BitShape[] = ["flat", "round", "sharp", "multi"];

export interface CatalogFacetState {
  playstyle?: Playstyle;
  spin?: SpinDirection;
  shape?: BitShape;
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
    spin: SPIN_DIRECTIONS.find((value) => value === params.spin),
    shape: BIT_SHAPES.find((value) => value === params.shape),
    teeth: parseRatchetTeeth(params.teeth),
    height: Number.isFinite(height) && height > 0 ? height : undefined,
  };
}

export function catalogFacetQuery(state: CatalogFacetState): Record<string, string> {
  const query: Record<string, string> = {};
  if (state.playstyle) query.playstyle = state.playstyle;
  if (state.spin) query.spin = state.spin;
  if (state.shape) query.shape = state.shape;
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
  const selected = [state.playstyle, state.spin, state.shape, state.teeth, state.height];
  if (selected.every((value) => value === undefined)) return records;

  return records.filter((record) => {
    const part = projectionFor(record.id);
    if (!part) return false;

    if (state.playstyle !== undefined) {
      if (part.type === "ratchet" || part.playstyle !== state.playstyle) return false;
    }
    if (state.spin !== undefined && (part.type !== "blade" || part.spinDirection !== state.spin)) return false;
    if (state.shape !== undefined && (part.type !== "bit" || part.shape !== state.shape)) return false;
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
): { playstyles: Playstyle[]; spins: SpinDirection[]; shapes: BitShape[]; teeth: RatchetTeeth[]; heights: number[] } {
  const playstyles = new Set<Playstyle>();
  const spins = new Set<SpinDirection>();
  const shapes = new Set<BitShape>();
  const teeth = new Set<RatchetTeeth>();
  const heights = new Set<number>();

  for (const record of records) {
    const part = projectionFor(record.id);
    if (!part) continue;
    if (part.type !== "ratchet" && part.playstyle) playstyles.add(part.playstyle);
    if (part.type === "blade" && part.spinDirection) spins.add(part.spinDirection);
    if (part.type === "bit" && part.shape) shapes.add(part.shape);
    if (part.type === "ratchet") {
      const count = ratchetTeethOf(part);
      if (count !== undefined) teeth.add(count);
      heights.add(part.height);
    }
  }

  return {
    playstyles: (["attack", "defense", "stamina", "balance"] as const).filter((value) => playstyles.has(value)),
    spins: SPIN_DIRECTIONS.filter((value) => spins.has(value)),
    shapes: BIT_SHAPES.filter((value) => shapes.has(value)),
    teeth: [...teeth].sort(compareTeeth),
    heights: [...heights].sort((left, right) => left - right),
  };
}

function compareTeeth(left: RatchetTeeth, right: RatchetTeeth): number {
  if (left === "metal") return 1;
  if (right === "metal") return -1;
  return left - right;
}
