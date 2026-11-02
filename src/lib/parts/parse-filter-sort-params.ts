import type { SortDirection, SortField } from "./filter-sort.ts";

const VALID_FIELDS: SortField[] = [
  "attack",
  "defense",
  "stamina",
  "xDash",
  "burstResistance",
  "releaseAt",
  "weight",
];

/**
 * The sort the `/parts` table carries in its URL. There used to be a `type`
 * filter here too (`?type=blade`), left over from the Part-only list; the
 * Catalog replaced it with `catalogPartType` and nothing read it any more, so
 * the old parameter now simply does nothing rather than being parsed and
 * dropped.
 */
export interface FilterSortState {
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
  const rawSort = firstValue(searchParams.sort);
  const rawDir = firstValue(searchParams.dir);

  return {
    sort: isSortField(rawSort) ? rawSort : undefined,
    direction: rawDir === "desc" ? "desc" : "asc",
  };
}

function firstValue(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

function isSortField(v: string | undefined): v is SortField {
  return VALID_FIELDS.includes(v as SortField);
}
