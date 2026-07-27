import type { PartType, SortDirection, SortField } from "./filter-sort.ts";

const VALID_TYPES: PartType[] = ["blade", "ratchet", "bit"];
const VALID_FIELDS: SortField[] = [
  "attack",
  "defense",
  "stamina",
  "xDash",
  "burstResistance",
  "releaseAt",
  "weight",
];

export interface FilterSortState {
  type: PartType | undefined;
  sort: SortField | undefined;
  direction: SortDirection;
}

/**
 * Reads Next.js's raw `searchParams` shape (string | string[] | undefined
 * per key). A hand-edited or stale URL can carry anything — invalid values
 * are ignored rather than thrown on, since this drives a shareable link,
 * not a form submission a user can be told to fix.
 */
export function parseFilterSortParams(
  searchParams: Record<string, string | string[] | undefined>,
): FilterSortState {
  const rawType = firstValue(searchParams.type);
  const rawSort = firstValue(searchParams.sort);
  const rawDir = firstValue(searchParams.dir);

  return {
    type: isPartType(rawType) ? rawType : undefined,
    sort: isSortField(rawSort) ? rawSort : undefined,
    direction: rawDir === "desc" ? "desc" : "asc",
  };
}

function firstValue(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

function isPartType(v: string | undefined): v is PartType {
  return VALID_TYPES.includes(v as PartType);
}

function isSortField(v: string | undefined): v is SortField {
  return VALID_FIELDS.includes(v as SortField);
}
