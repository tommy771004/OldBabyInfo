import type { Part } from "../parts/schema.ts";
import type { GenerationCatalogRecord } from "../generation-catalog/schema.ts";
import { matchFunboxRelease } from "../generation-catalog/releases.ts";
import {
  matchFunboxProductToPart,
  parseFunboxCategoryProducts,
  type FunboxCategoryListing,
} from "./funbox-category.ts";

/**
 * A Funbox request that failed at the transport or HTTP layer. `status` is
 * absent when the request never got a response at all — which is exactly the
 * shape of the `fetch failed` storm the scheduled runner hits when Funbox
 * refuses the GitHub runner's datacenter address.
 */
export class FunboxFetchError extends Error {
  readonly status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = "FunboxFetchError";
    if (status !== undefined) this.status = status;
  }
}

export interface FunboxRetryOptions {
  attempts?: number;
  baseDelayMs?: number;
  maxDelayMs?: number;
}

const DEFAULT_RETRY: Required<FunboxRetryOptions> = {
  attempts: 3,
  baseDelayMs: 1_000,
  maxDelayMs: 8_000,
};

/**
 * Retry transport failures and the statuses Funbox returns when it is
 * throttling or briefly unhealthy. A 404 or a 403 is a settled answer: asking
 * again only burns the runner's clock.
 */
export function isRetryableFunboxError(error: unknown): boolean {
  if (!(error instanceof FunboxFetchError)) return true;
  if (error.status === undefined) return true;
  return error.status === 408 || error.status === 429 || error.status >= 500;
}

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
  retry?: FunboxRetryOptions;
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
  const retry = { ...DEFAULT_RETRY, ...options.retry };
  const attempts = Math.max(1, retry.attempts);

  /**
   * One page request, retried with exponential backoff. Only the fetch is
   * wrapped: a payload that parses badly is a data problem and repeating the
   * request cannot change it.
   */
  async function fetchWithRetry(endpoint: string): Promise<unknown> {
    let lastError: unknown;
    for (let attempt = 1; attempt <= attempts; attempt += 1) {
      try {
        return await options.fetcher(endpoint);
      } catch (error) {
        lastError = error;
        if (attempt === attempts || !isRetryableFunboxError(error)) break;
        await sleep(Math.min(retry.baseDelayMs * 2 ** (attempt - 1), retry.maxDelayMs));
      }
    }
    throw lastError;
  }

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
        const payload = await fetchWithRetry(endpointForPage(source.endpoint, page));
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
