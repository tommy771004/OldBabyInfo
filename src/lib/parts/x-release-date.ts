export const X_GENERATION_START_DATE = "2023-01-01";

export function filterXEraEntries<T extends { release_at?: string }>(entries: T[]): T[] {
  return entries.filter((entry) =>
    !entry.release_at || entry.release_at.slice(0, 10) >= X_GENERATION_START_DATE,
  );
}
