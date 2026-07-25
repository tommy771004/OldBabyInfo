import type { FilterSortState } from "./parse-filter-sort-params.ts";

/**
 * Shared by the server page and the client search component. A function
 * can't cross the Server→Client Component boundary as a prop (React
 * Server Components only serialize data) — both sides import this
 * independently instead of one passing it to the other.
 */
export function buildQuery(state: Partial<FilterSortState>): Record<string, string> {
  const query: Record<string, string> = {};
  if (state.type) query.type = state.type;
  if (state.sort) query.sort = state.sort;
  if (state.direction) query.dir = state.direction;
  return query;
}
