import { parsePageSize, parsePaginationParams, type PaginationState } from "@/lib/pagination.ts";

/**
 * The list view of the Catalog (`/parts`) pages through its records ten at a
 * time by default. Ten is one screen of the Stat table on a phone; fifty is
 * the most a reader asked for when scanning a whole Part type.
 */
export const CATALOG_PAGE_SIZES = [10, 20, 50] as const;
export const CATALOG_DEFAULT_PAGE_SIZE = 10;
export const CATALOG_PAGE_PARAM = "catalogPage";
export const CATALOG_SIZE_PARAM = "catalogSize";

export type CatalogPageSize = (typeof CATALOG_PAGE_SIZES)[number];
export type CatalogPaginationState = PaginationState<CatalogPageSize>;

const config = {
  pageParam: CATALOG_PAGE_PARAM,
  sizeParam: CATALOG_SIZE_PARAM,
  sizes: CATALOG_PAGE_SIZES,
  defaultSize: CATALOG_DEFAULT_PAGE_SIZE,
} as const;

export function parseCatalogPaginationParams(
  searchParams: Record<string, string | string[] | undefined>,
  totalItems: number,
): CatalogPaginationState {
  return parsePaginationParams(searchParams, totalItems, config);
}

/** The page size a URL asks for, before the total is known. */
export function parseCatalogPageSize(value: string | undefined): CatalogPageSize {
  return parsePageSize(value, config);
}

/**
 * The page a URL asks for, before the total is known; the browser clamps it
 * once it has counted the visible records.
 */
export function parseCatalogPage(value: string | undefined): number {
  return parseCatalogPaginationParams({ [CATALOG_PAGE_PARAM]: value }, Number.MAX_SAFE_INTEGER).page;
}
