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
  /**
   * Events present in the existing dataset but missing from the parsed sheet —
   * a cancelled or rescheduled session. Removals are only computed when the
   * sheet actually yielded rows (see `diffAgainstExisting`): an empty or
   * fully-failed fetch must not read as "everything was cancelled".
   */
  removed: { event: Event; reason: string }[];
  unchanged: number;
  failed: { rawRow: string; reason: string }[];
}

/**
 * A bounded, human-readable version of the report, for places that cannot
 * take the full one.
 *
 * The scheduled ingest used to paste its entire stdout into the review PR's
 * body. On the real sheet that is ~700 rows × 2 lines of Chinese — about
 * 134 KB, past Linux's 128 KB ceiling for one environment variable — and the
 * `create-pull-request` action passes its body through the environment. Every
 * night the runner failed with `Argument list too long` (E2BIG) *after* a
 * successful fetch, so a working pipeline produced no PR for two weeks.
 *
 * What a reviewer actually needs before merging is the shape of the change
 * and the rows that were dropped; the full per-row diff stays in the job log,
 * which has no such limit. Failures come first because they are the only part
 * asking the reviewer to do something.
 */
export function formatIngestSummary(
  report: IngestReport,
  options: { maxRowsPerSection?: number; maxBytes?: number } = {},
): string {
  const maxRows = options.maxRowsPerSection ?? 20;
  const maxBytes = options.maxBytes ?? 8_000;

  const lines: string[] = [
    `${report.added.length} added, ${report.changed.length} changed, ` +
      `${report.removed.length} removed, ${report.unchanged} unchanged, ${report.failed.length} failed.`,
  ];

  function section(heading: string, rows: string[]): void {
    if (rows.length === 0) return;
    lines.push("", `### ${heading} (${rows.length})`);
    for (const row of rows.slice(0, maxRows)) lines.push(`- ${row}`);
    if (rows.length > maxRows) {
      lines.push(`- …另有 ${rows.length - maxRows} 筆，見 job log。`);
    }
  }

  section(
    "解析失敗（來源資料需要修正）",
    report.failed.map((failure) => `\`${failure.rawRow}\` — ${failure.reason}`),
  );
  section("新增", report.added.map(({ event }) => `${event.id}`));
  section("變更", report.changed.map(({ after }) => `${after.id}`));
  // Removals sit between 變更 and nothing: a cancelled session is the one
  // change that takes real information away from readers, so it is named
  // even when everything else is routine.
  section(
    "移除（來源表已無此場次）",
    report.removed.map(({ event, reason }) => `${event.id} — ${reason}`),
  );

  const summary = lines.join("\n");
  const encoder = new TextEncoder();
  const encoded = encoder.encode(summary);
  if (encoded.byteLength <= maxBytes) return summary;

  // Cutting a UTF-8 byte range lands mid-character on Chinese text; decoding
  // in non-fatal mode turns the partial tail into a replacement character,
  // which is then dropped.
  const notice = "\n\n…摘要已截斷，完整內容見 job log。";
  const budget = maxBytes - encoder.encode(notice).byteLength;
  const cut = new TextDecoder("utf-8").decode(encoded.subarray(0, budget));
  return `${cut.replace(/�+$/, "")}${notice}`;
}

function eventWithSourceExcerpt(row: SheetRowResult): Event | undefined {
  if (!row.event) return undefined;
  return row.rawRow ? { ...row.event, sourceExcerpt: row.rawRow } : row.event;
}

/**
 * Ticket 32: "與既有 Event 比對，只產生真實新增與變更" — every parsed row
 * is classified against the current dataset by id: genuinely new, changed
 * (same id, different content — e.g. a corrected capacity), or unchanged
 * (byte-for-byte the same, contributes nothing to the diff).
 */
export function diffAgainstExisting(parsed: SheetRowResult[], existing: Event[]): IngestReport {
  const existingById = new Map(existing.map((e) => [e.id, e]));
  const report: IngestReport = { added: [], changed: [], removed: [], unchanged: 0, failed: [] };

  for (const row of parsed) {
    if (row.status === "failed") {
      report.failed.push({ rawRow: row.rawRow ?? "", reason: row.reason ?? "Unknown parse failure" });
      continue;
    }
    if (row.status !== "parsed") continue;
    const event = eventWithSourceExcerpt(row);
    if (!event) continue;
    const prior = existingById.get(event.id);
    if (!prior) {
      report.added.push({ event, rawRow: row.rawRow ?? "" });
    } else if (JSON.stringify(prior) !== JSON.stringify(event)) {
      report.changed.push({ before: prior, after: event, rawRow: row.rawRow ?? "" });
    } else {
      report.unchanged++;
    }
  }

  // Removals only count against a sheet that actually produced rows. A
  // truncated fetch, a renamed tab, or a total parse failure all look the
  // same as "every session was cancelled" here — and silently emptying the
  // calendar would be far worse than keeping a stale event for one more run.
  const sheetYieldedRows = [...report.added, ...report.changed].length + report.unchanged > 0;
  if (sheetYieldedRows) {
    const seenIds = new Set<string>();
    for (const row of parsed) {
      if (row.status !== "parsed" || !row.event) continue;
      seenIds.add(row.event.id);
    }
    for (const event of existing) {
      if (!seenIds.has(event.id)) {
        report.removed.push({ event, reason: "missing from source sheet" });
      }
    }
  }

  return report;
}
