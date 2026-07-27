import { weightSortValueOf } from "./part-weight.ts";
import type { Part } from "./schema.ts";

export type PartType = Part["type"];
export type SortField =
  | "attack"
  | "defense"
  | "stamina"
  | "xDash"
  | "burstResistance"
  | "releaseAt"
  | "weight";
export type SortDirection = "asc" | "desc";

export function filterByType(parts: Part[], type: PartType | undefined): Part[] {
  if (!type) return parts;
  return parts.filter((p) => p.type === type);
}

/** xDash/burstResistance don't exist on Blade/Ratchet — 0 for sort purposes,
 *  matching the "—" shown for those cells in the list page. */
export function sortValueOf(part: Part, field: SortField): number {
  if (field === "weight") {
    // Same convention as an unknown release date: a Part nobody has weighed
    // sorts as the least-known, never as the lightest.
    return weightSortValueOf(part) ?? -Infinity;
  }
  if (field === "releaseAt") {
    // null (never matched an official record) sorts as oldest, not newest —
    // an unknown release date shouldn't outrank every dated part.
    return part.releaseAt ? Date.parse(part.releaseAt) : -Infinity;
  }
  if (field === "attack" || field === "defense" || field === "stamina") {
    return part.stats[field];
  }
  return part.type === "bit" ? part.stats[field] : 0;
}

export function sortParts(parts: Part[], field: SortField, direction: SortDirection): Part[] {
  const factor = direction === "asc" ? 1 : -1;
  return [...parts].sort((a, b) => (sortValueOf(a, field) - sortValueOf(b, field)) * factor);
}
