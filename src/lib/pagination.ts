/**
 * URL-driven pagination shared by every paged list on the site.
 *
 * A page is a pair of query parameters, never client state: the list is
 * server-rendered, the URL is what a reader shares, and a crawler walks the
 * same links a person clicks. Each list names its own parameters and page
 * sizes; the clamping rules are the same everywhere so a shared URL that
 * points past the end lands on the last page instead of an empty one.
 */

export interface PaginationConfig<Size extends number> {
  pageParam: string;
  sizeParam: string;
  sizes: readonly Size[];
  defaultSize: Size;
}

export interface PaginationState<Size extends number> {
  page: number;
  pageSize: Size;
  totalPages: number;
  start: number;
  end: number;
}

export function parsePaginationParams<Size extends number>(
  searchParams: Record<string, string | string[] | undefined>,
  totalItems: number,
  config: PaginationConfig<Size>,
): PaginationState<Size> {
  const pageSize = parsePageSize(firstValue(searchParams[config.sizeParam]), config);
  const totalPages = Math.max(1, Math.ceil(Math.max(0, totalItems) / pageSize));
  const requestedPage = parsePositiveInteger(firstValue(searchParams[config.pageParam]));
  const page = Math.min(requestedPage ?? 1, totalPages);

  return {
    page,
    pageSize,
    totalPages,
    start: (page - 1) * pageSize,
    end: Math.min(page * pageSize, Math.max(0, totalItems)),
  };
}

export function parsePageSize<Size extends number>(
  value: string | undefined,
  config: Pick<PaginationConfig<Size>, "sizes" | "defaultSize">,
): Size {
  const parsed = parsePositiveInteger(value);
  return config.sizes.includes(parsed as Size) ? (parsed as Size) : config.defaultSize;
}

function firstValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function parsePositiveInteger(value: string | undefined): number | undefined {
  if (!value || !/^\d+$/.test(value)) return undefined;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : undefined;
}
