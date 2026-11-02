import { generationIdSchema, type GenerationCatalogRecord, type GenerationId } from "@/lib/generation-catalog/schema.ts";
import { searchGenerationCatalog } from "@/lib/generation-catalog/search.ts";
import { CATALOG_DEFAULT_PAGE_SIZE, CATALOG_SIZE_PARAM, type CatalogPageSize } from "@/lib/generation-catalog/pagination.ts";
import { publishableCatalogRecords } from "./catalog-part-rows.ts";

export type CatalogKind = "all" | GenerationCatalogRecord["kind"];

/**
 * Which slice of the Catalog `/parts` is showing, read from the URL once.
 * The list, the tab bar, the facets, the sort and every link on the page
 * all have to describe this same slice — when the browser component kept a
 * second copy of these rules, its tab links quietly fell back to BEYBLADE X
 * in the middle of an all-Generations search.
 */
export interface CatalogView {
  /** The Generation the chips and the stat table are about. Still "x" on
   *  an all-Generations search, because the search form's "this
   *  generation" option needs one to name. */
  generation: GenerationId;
  /** Only the search form's explicit empty `catalogGeneration` means this. */
  acrossGenerations: boolean;
  system?: string;
  kind: CatalogKind;
  partType?: string;
  query?: string;
}

type SearchParams = Record<string, string | string[] | undefined>;

export function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function parseCatalogKind(value: string | undefined): CatalogKind | undefined {
  return value === "all" || value === "beyblade" || value === "part" || value === "release" || value === "equipment"
    ? value
    : undefined;
}

export function parseCatalogView(params: SearchParams): CatalogView {
  const catalogGeneration = firstParam(params.catalogGeneration);
  // An absent parameter means the default Generation. Only the empty value
  // searches across Generations — any link that merely omitted it used to
  // widen the list to all four while the page still said BEYBLADE X.
  const acrossGenerations = catalogGeneration === "";
  return {
    generation: generationIdSchema.safeParse(catalogGeneration).success ? catalogGeneration as GenerationId : "x",
    acrossGenerations,
    // Every System belongs to one Generation, so a System on an
    // all-Generations search would quietly narrow it back to one.
    system: acrossGenerations ? undefined : firstParam(params.catalogSystem) || undefined,
    // The default tab is applied here, once, so the records are never
    // filtered for one tab and labelled as another.
    kind: parseCatalogKind(firstParam(params.catalogKind)) ?? "part",
    partType: firstParam(params.catalogPartType) || undefined,
    query: firstParam(params.catalogQuery),
  };
}

/**
 * The records the view admits, and the pool the tab bar counts: the same
 * search *before* the selected tab narrows it, so every tab stays reachable
 * and its count answers "how many are there under this tab". Both are
 * publishable only — a placeholder name never reaches a list or a count.
 */
export function selectCatalogView(records: GenerationCatalogRecord[], view: CatalogView) {
  const scope = {
    generationId: view.acrossGenerations ? undefined : view.generation,
    system: view.system,
  };
  return {
    records: publishableCatalogRecords(searchGenerationCatalog(records, view.query ?? "", {
      ...scope,
      kind: view.kind === "all" ? undefined : view.kind,
      partType: view.partType,
    })),
    tabPool: publishableCatalogRecords(searchGenerationCatalog(records, view.query ?? "", scope)),
  };
}

/**
 * The query string that reproduces a view — the base of every tab, facet,
 * sort and page link. Links start over at page 1 but keep the reader's page
 * size, and a search carries through: the tab counts are per-tab hit counts
 * of that search, so a tab link that dropped it would land on a different
 * number than the tab showed.
 */
export function catalogViewQuery(view: CatalogView, pageSize: CatalogPageSize): Record<string, string> {
  return {
    // The empty value round-trips as "search everywhere".
    catalogGeneration: view.acrossGenerations ? "" : view.generation,
    ...(view.system ? { catalogSystem: view.system } : {}),
    catalogKind: view.kind,
    ...(view.partType ? { catalogPartType: view.partType } : {}),
    ...(view.query ? { catalogQuery: view.query } : {}),
    ...(pageSize !== CATALOG_DEFAULT_PAGE_SIZE ? { [CATALOG_SIZE_PARAM]: String(pageSize) } : {}),
  };
}
