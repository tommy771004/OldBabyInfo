import type { Event } from "./schema.ts";
import type { SheetRowResult } from "./csv-source.ts";

/** The default 10% circuit-breaker threshold — the two known real typos
 *  in the actual source are 2 rows out of ~700 (<1%), so this is already
 *  a generous margin above anything seen in real data. Above it, a
 *  failure rate more likely means the sheet's shape changed than that
 *  hand-entry got unusually sloppy this run. */
export const DEFAULT_MAX_FAILURE_RATE = 0.1;

/**
 * Ticket 32: "來源格式改變導致解析失敗時中止並告警" — distinguishes
 * routine per-row typo noise (a couple of bad rows among hundreds) from a
 * structural format break (a large fraction failing at once), which is
 * the actual signal an unattended run needs to decide whether to abort.
 */
export function exceedsFailureRate(
  failedCount: number,
  totalDataRows: number,
  maxRate: number = DEFAULT_MAX_FAILURE_RATE,
): boolean {
  if (totalDataRows === 0) return false;
  return failedCount / totalDataRows > maxRate;
}

/** A basic real-world sanity check ticket 32 asks for directly ("日期與
 *  地點通過值域驗證") beyond the schema's own type/format checks: a G3
 *  store event dated implausibly far in the past or future is far more
 *  likely a parsing mistake (wrong fallback year, swapped month/day) than
 *  a genuine event, and would send a real player to the wrong place on
 *  the wrong day. `now` is injected so this stays deterministic in tests. */
export function isPlausibleEventDate(iso: string, now: Date = new Date()): boolean {
  const date = new Date(iso);
  const oneYearMs = 365 * 24 * 60 * 60 * 1000;
  return date.getTime() > now.getTime() - oneYearMs && date.getTime() < now.getTime() + oneYearMs;
}

export interface IngestReport {
  added: { event: Event; rawRow: string }[];
  changed: { before: Event; after: Event; rawRow: string }[];
  unchanged: number;
}

/**
 * Ticket 32: "與既有 Event 比對，只產生真實新增與變更" — every parsed row
 * is classified against the current dataset by id: genuinely new, changed
 * (same id, different content — e.g. a corrected capacity), or unchanged
 * (byte-for-byte the same, contributes nothing to the diff).
 */
export function diffAgainstExisting(parsed: SheetRowResult[], existing: Event[]): IngestReport {
  const existingById = new Map(existing.map((e) => [e.id, e]));
  const report: IngestReport = { added: [], changed: [], unchanged: 0 };

  for (const row of parsed) {
    if (row.status !== "parsed" || !row.event) continue;
    const prior = existingById.get(row.event.id);
    if (!prior) {
      report.added.push({ event: row.event, rawRow: row.rawRow ?? "" });
    } else if (JSON.stringify(prior) !== JSON.stringify(row.event)) {
      report.changed.push({ before: prior, after: row.event, rawRow: row.rawRow ?? "" });
    } else {
      report.unchanged++;
    }
  }

  return report;
}
