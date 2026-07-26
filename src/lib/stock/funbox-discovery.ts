import type { Part } from "../parts/schema.ts";
import type { GenerationCatalogRecord } from "../generation-catalog/schema.ts";
import { matchFunboxRelease } from "../generation-catalog/releases.ts";
import {
  matchFunboxProductToPart,
  parseFunboxCategoryProducts,
  type FunboxCategoryListing,
} from "./funbox-category.ts";

export interface FunboxCategorySource {
  id: string;
  endpoint: string;
}

export interface FunboxDiscoveredListing extends FunboxCategoryListing {
  partId?: string;
  releaseId?: string;
}

export interface FunboxDiscoveryReport {
  listings: FunboxDiscoveredListing[];
  skippedRows: number;
  needsReview: number;
  failedSources: Array<{ id: string; error: string }>;
}

export interface FunboxDiscoveryOptions {
  fetcher: (endpoint: string) => Promise<unknown>;
  releases?: GenerationCatalogRecord[];
  minIntervalMs?: number;
  sleep?: (durationMs: number) => Promise<void>;
}

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function pageSizeOf(endpoint: string): number {
  try {
    const limit = Number(new URL(endpoint).searchParams.get("limit") ?? 18);
    return Number.isInteger(limit) && limit > 0 ? limit : 18;
  } catch {
    return 18;
  }
}

function endpointForPage(endpoint: string, page: number): string {
  const url = new URL(endpoint);
  url.searchParams.set("page", String(page));
  return url.toString();
}

export async function discoverFunboxListings(
  sources: FunboxCategorySource[],
  parts: Part[],
  options: FunboxDiscoveryOptions,
): Promise<FunboxDiscoveryReport> {
  const minIntervalMs = Math.max(0, options.minIntervalMs ?? 1000);
  const sleep = options.sleep ?? ((durationMs: number) => new Promise<void>((resolve) => setTimeout(resolve, durationMs)));
  const byId = new Map<string, FunboxDiscoveredListing>();
  const failedSources: Array<{ id: string; error: string }> = [];
  let skippedRows = 0;
  let needsReview = 0;
  let requestCount = 0;

  for (const source of sources) {
    const pageSize = pageSizeOf(source.endpoint);
    for (let page = 1; page <= 100; page += 1) {
      if (requestCount > 0 && minIntervalMs > 0) await sleep(minIntervalMs);
      requestCount += 1;

      try {
        const payload = await options.fetcher(endpointForPage(source.endpoint, page));
        const report = parseFunboxCategoryProducts(payload);
        skippedRows += report.skippedRows;
        for (const listing of report.listings) {
          let releaseId: string | undefined;
          if (options.releases) {
            const releaseMatch = matchFunboxRelease(listing, options.releases);
            if (releaseMatch.status === "needs_review" && releaseMatch.reason === "ambiguous") {
              needsReview += 1;
              continue;
            }
            if (releaseMatch.status === "matched") releaseId = releaseMatch.releaseId;
          }
          const partId = matchFunboxProductToPart(listing.productName, parts);
          if (!partId && !releaseId) {
            needsReview += 1;
            continue;
          }
          if (byId.has(listing.id)) {
            skippedRows += 1;
            continue;
          }
          byId.set(listing.id, {
            ...listing,
            ...(partId ? { partId } : {}),
            ...(releaseId ? { releaseId } : {}),
          });
        }

        if (!Array.isArray(payload) || payload.length < pageSize) break;
      } catch (error) {
        failedSources.push({ id: source.id, error: messageOf(error) });
        break;
      }
    }
  }

  return {
    listings: [...byId.values()].sort((left, right) => left.id.localeCompare(right.id)),
    skippedRows,
    needsReview,
    failedSources,
  };
}
