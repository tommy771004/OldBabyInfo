/**
 * Automated Event ingest (ticket 32) — the unattended counterpart to
 * ticket 31's manual generate-events-seed.ts. Same real source, same
 * row-level parsing (src/lib/events/csv-source.ts), but meant to run
 * unsupervised (e.g. on a schedule) rather than by a human watching the
 * console. Two differences that follow directly from that:
 *
 *   - A circuit breaker aborts the whole run if too many rows fail to
 *     parse. One or two typo rows among hundreds is normal, real,
 *     already-seen source noise (see csv-source.ts's own doc comments) —
 *     not a reason to stop. A double-digit failure RATE means the sheet's
 *     shape itself probably changed, and continuing would either write a
 *     badly-degraded dataset or silently drop most of a real update.
 *   - Output is a diff against the existing data/events.json (added /
 *     changed / unchanged), not a wholesale overwrite — "只產生真實新增
 *     與變更". `--dry-run` prints that diff without writing anything.
 *
 * This script does NOT open a pull request itself — wiring any of this
 * into a scheduled CI job with PR review is ticket 25's job, and needs
 * repo-level secrets this script has no access to or opinion about.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { eventsFileSchema } from "../src/lib/events/schema.ts";
import { fetchSheetCsv, parseSheetCsv, type SheetRowResult } from "../src/lib/events/csv-source.ts";
import {
  diffAgainstExisting,
  exceedsFailureRate,
  formatIngestSummary,
  isPlausibleEventDate,
  type IngestReport,
} from "../src/lib/events/ingest-diff.ts";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT_PATH = join(__dirname, "..", "data", "events.json");

// Reads the JSON file directly rather than importing src/lib/events/repository.ts:
// that module's `import ... from "*.json"` needs an import-attribute Next.js's
// own bundler is fine with but scripts/tsconfig.json's plain NodeNext resolution
// isn't — matching generate-parts-seed.ts / generate-events-seed.ts's own
// existing convention of reading data files directly rather than through the
// app's repository layer.
function readExistingEvents(): ReturnType<typeof eventsFileSchema.parse> {
  return eventsFileSchema.parse(JSON.parse(readFileSync(OUTPUT_PATH, "utf-8")));
}

/**
 * The full per-row diff belongs in the job log, which has no size limit. A
 * caller that has to put the result somewhere bounded — the review PR's body,
 * where an oversized value killed every scheduled run with E2BIG — sets
 * INGEST_SUMMARY_PATH and reads the capped summary from there instead.
 */
function writeSummaryIfRequested(report: IngestReport): void {
  const summaryPath = process.env.INGEST_SUMMARY_PATH?.trim();
  if (!summaryPath) return;
  writeFileSync(summaryPath, `${formatIngestSummary(report)}\n`);
}

const SHEETS: Array<{ id: string; sheetId: string; gid: string; year: number }> = [
  { id: "funbox-g3", sheetId: "1BgyEeGOvVy7G4FQgwFoEjtjpuP0VW58wpQJlzOHUjvQ", gid: "0", year: 2026 },
  { id: "b4-g3", sheetId: "1myWxo3cQbsFryJi6Pv8w5nFGXCgBwrhYe8C5iUvVfN0", gid: "0", year: 2026 },
];

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  const parsedRows: SheetRowResult[] = [];

  for (const sheet of SHEETS) {
    console.log(`Fetching ${sheet.id}...`);
    const csv = await fetchSheetCsv(sheet.sheetId, sheet.gid);
    const results = parseSheetCsv(csv, sheet.id, sheet.sheetId, sheet.year);

    const dataRows = results.filter((r) => r.status !== "skipped_header");
    const failed = dataRows.filter((r) => r.status === "failed");

    if (exceedsFailureRate(failed.length, dataRows.length)) {
      const rate = dataRows.length > 0 ? (failed.length / dataRows.length) * 100 : 0;
      console.error(
        `Aborting: ${sheet.id} failed ${failed.length}/${dataRows.length} rows ` +
          `(${rate.toFixed(1)}%, over the circuit-breaker threshold) — likely a source ` +
          `format change, not routine typos. No data written.`,
      );
      for (const row of failed.slice(0, 5)) {
        console.error(`  (${row.rawRow}): ${row.reason}`);
      }
      process.exit(1);
    }

    for (const row of failed) {
      console.warn(`Skipping row (${row.rawRow}): ${row.reason}`);
    }

    const implausible = dataRows.filter((r) => r.event && !isPlausibleEventDate(r.event.date));
    if (implausible.length > 0) {
      console.error(
        `Aborting: ${implausible.length} parsed event(s) have an implausible date ` +
          `(more than a year from today) — sending a player to the wrong date is worse ` +
          `than not updating at all. No data written.`,
      );
      for (const row of implausible.slice(0, 5)) {
        console.error(`  ${row.event!.id}: date=${row.event!.date}`);
      }
      process.exit(1);
    }

    parsedRows.push(...results);
  }

  const existingEvents = readExistingEvents();
  const report = diffAgainstExisting(parsedRows, existingEvents);

  console.log(
    `\n${report.added.length} added, ${report.changed.length} changed, ` +
      `${report.unchanged} unchanged, ${report.failed.length} failed.`,
  );
  for (const { event, rawRow } of report.added) {
    console.log(`  + ${event.id}\n    source: ${rawRow}`);
  }
  for (const { after, rawRow } of report.changed) {
    console.log(`  ~ ${after.id}\n    source: ${rawRow}`);
  }
  for (const failure of report.failed) {
    console.log(`  ! failed\n    source: ${failure.rawRow}\n    reason: ${failure.reason}`);
  }

  writeSummaryIfRequested(report);

  if (report.added.length === 0 && report.changed.length === 0) {
    console.log("Nothing to update.");
    return;
  }

  if (dryRun) {
    console.log("\n--dry-run: not writing.");
    return;
  }

  const merged = [...existingEvents];
  const byId = new Map(merged.map((e, i) => [e.id, i]));
  for (const { event } of report.added) merged.push(event);
  for (const { after } of report.changed) merged[byId.get(after.id)!] = after;

  const validated = eventsFileSchema.parse(merged); // throws (and aborts, unwritten) if structurally invalid
  writeFileSync(OUTPUT_PATH, JSON.stringify(validated, null, 2) + "\n");
  console.log(`Wrote ${validated.length} events to ${OUTPUT_PATH}.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
