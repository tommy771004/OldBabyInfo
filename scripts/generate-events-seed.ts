/**
 * Manual seed (ticket 31 — deliberately NOT an automated pipeline; that's
 * ticket 32, scripts/ingest-events.ts). Run manually with
 * `node scripts/generate-events-seed.ts`, review the diff to
 * `data/events.json` before merging. Pulls the current G3 schedule sheets
 * linked from the hackmd doc — update SHEETS below when re-running for a
 * later period.
 *
 * Row-level parsing (date/time/capacity quirks, registration-method
 * mapping) lives in src/lib/events/csv-source.ts, shared with
 * ingest-events.ts so the manual and automated paths can never silently
 * drift into two different understandings of the same source format.
 */
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { eventsFileSchema, type Event } from "../src/lib/events/schema.ts";
import { fetchSheetCsv, parseSheetCsv } from "../src/lib/events/csv-source.ts";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT_PATH = join(__dirname, "..", "data", "events.json");

// From https://hackmd.io/@liangyutw/beyblade-important-record, 2026年7~8月 period.
const SHEETS: Array<{ id: string; sheetId: string; gid: string; year: number }> = [
  { id: "funbox-g3", sheetId: "1BgyEeGOvVy7G4FQgwFoEjtjpuP0VW58wpQJlzOHUjvQ", gid: "0", year: 2026 },
  { id: "b4-g3", sheetId: "1myWxo3cQbsFryJi6Pv8w5nFGXCgBwrhYe8C5iUvVfN0", gid: "0", year: 2026 },
];

async function main() {
  const allEvents: Event[] = [];

  for (const sheet of SHEETS) {
    console.log(`Fetching ${sheet.id}...`);
    const csv = await fetchSheetCsv(sheet.sheetId, sheet.gid);
    const results = parseSheetCsv(csv, sheet.id, sheet.sheetId, sheet.year);

    for (const result of results) {
      if (result.status === "failed") {
        console.warn(`Skipping row (${result.rawRow}): ${result.reason}`);
      }
    }

    const events = results
      .filter((r) => r.status === "parsed")
      .map((r) => (r.event && r.rawRow ? { ...r.event, sourceExcerpt: r.rawRow } : r.event!));
    console.log(`  ${events.length} events parsed`);
    allEvents.push(...events);
  }

  // De-duplicate: the same venue can appear with the same date/time if a
  // sheet lists it twice (seen once in review). Keep the first, log the rest.
  const seen = new Set<string>();
  const deduped: Event[] = [];
  for (const event of allEvents) {
    if (seen.has(event.id)) {
      console.warn(`Skipping duplicate id "${event.id}"`);
      continue;
    }
    seen.add(event.id);
    deduped.push(event);
  }

  const result = eventsFileSchema.safeParse(deduped);
  if (!result.success) {
    console.error(`Generated seed data failed schema validation (${result.error.issues.length} issues). First 10:`);
    for (const issue of result.error.issues.slice(0, 10)) {
      console.error(`  ${issue.path.join(".")}: ${issue.message}`);
    }
    process.exit(1);
  }

  writeFileSync(OUTPUT_PATH, JSON.stringify(result.data, null, 2) + "\n");
  console.log(`Wrote ${result.data.length} events to ${OUTPUT_PATH}.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
