export const DEFAULT_STALE_AFTER_MS = 24 * 60 * 60 * 1000;

export function isStockListingStale(
  listing: { capturedAt: string },
  now: string | Date,
  staleAfterMs = DEFAULT_STALE_AFTER_MS,
): boolean {
  const capturedAt = new Date(listing.capturedAt).getTime();
  const nowAt = new Date(now).getTime();
  if (!Number.isFinite(capturedAt) || !Number.isFinite(nowAt)) return true;
  return nowAt - capturedAt >= staleAfterMs;
}
