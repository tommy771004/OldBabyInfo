/**
 * Manual seed (ticket 31 — deliberately NOT an automated pipeline; that's
 * ticket 32). Run manually with `node scripts/generate-events-seed.ts`,
 * review the diff to `data/events.json` before merging. Pulls the current
 * G3 schedule sheets linked from the hackmd doc — update SHEETS below when
 * re-running for a later period.
 */
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { eventSchema, eventsFileSchema, type Event } from "../src/lib/events/schema.ts";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT_PATH = join(__dirname, "..", "data", "events.json");

// From https://hackmd.io/@liangyutw/beyblade-important-record, 2026年7~8月 period.
const SHEETS: Array<{ id: string; sheetId: string; gid: string; year: number }> = [
  { id: "funbox-g3", sheetId: "1BgyEeGOvVy7G4FQgwFoEjtjpuP0VW58wpQJlzOHUjvQ", gid: "0", year: 2026 },
  { id: "b4-g3", sheetId: "1myWxo3cQbsFryJi6Pv8w5nFGXCgBwrhYe8C5iUvVfN0", gid: "0", year: 2026 },
];

const REGISTRATION_METHOD: Record<string, Event["registrationMethod"]> = {
  現場: "onsite",
  線上: "online",
  電話: "phone",
  皆可: "either",
  門市社群: "store_community",
};

async function fetchCsv(sheetId: string, gid: string): Promise<string> {
  const url = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${gid}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch sheet ${sheetId}: ${res.status}`);
  return res.text();
}

/** Splits one CSV line into cells. Real cell content here never contains a
 *  comma (checked against the actual data) — the only quoted/multiline
 *  field is the trailing disclaimer, which parseDate's caller filters out
 *  before this ever needs to handle a quote. A full CSV parser would be
 *  overkill for a hand-reviewed, re-run-when-needed seed script. */
function splitRow(line: string): string[] {
  return line.split(",").map((cell) => cell.trim());
}

/** "7/11" (no year, sheet's own period supplies it) or "2026/7/12"
 *  (already has one) — both appear across the two source sheets. A trailing
 *  slash typo ("2026/8/9/") is real, hand-entered source data, not
 *  something to special-case beyond dropping the resulting empty part. */
function parseDate(raw: string, fallbackYear: number): string {
  const parts = raw
    .split("/")
    .filter((p) => p.length > 0)
    .map(Number);
  if (parts.some((n) => !Number.isFinite(n))) {
    throw new Error(`Unparseable date: "${raw}"`);
  }
  const [a, b, c] = parts;
  const [year, month, day] = parts.length === 3 ? [a!, b!, c!] : [fallbackYear, a!, b!];
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

/** One row had "32-48" (a range) instead of a single number — take the
 *  lower bound, the same number a walk-in registrant would be quoted. */
function parseCapacity(raw: string): number {
  const match = raw.match(/\d+/);
  if (!match) throw new Error(`Unparseable capacity: "${raw}"`);
  return Number(match[0]);
}

/** "9:00" is common (no leading zero); the schema requires zero-padded
 *  HH:MM so stored times sort and compare consistently. */
function parseTime(raw: string): string {
  const match = raw.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) throw new Error(`Unparseable time: "${raw}"`);
  return `${match[1]!.padStart(2, "0")}:${match[2]}`;
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "");
}

function parseSheet(csv: string, sourceId: string, sheetId: string, year: number): Event[] {
  const lines = csv.split("\n");
  const events: Event[] = [];

  for (const line of lines) {
    const cells = splitRow(line);
    const [no, venueName, , venueAddress, dateRaw, time, capacityRaw, methodRaw, ageCategory] = cells;
    if (!no || !/^\d+$/.test(no)) continue; // skips header/title/disclaimer rows
    if (!venueName || !dateRaw || !time) continue;

    const method = REGISTRATION_METHOD[methodRaw ?? ""];
    if (!method) {
      console.warn(`Skipping row ${no} (${venueName}): unknown registration method "${methodRaw}"`);
      continue;
    }

    // Hand-entered source data has real typos (a stray "/" in a date, "."
    // instead of ":" in a time). Skip and report the one bad row rather
    // than losing the other ~500 good ones to a batch-level failure.
    let candidate: Event;
    try {
      const date = parseDate(dateRaw, year);
      const parsedTime = parseTime(time);
      candidate = {
        // Same venue/time can host multiple age-bracket sessions — the row
        // number disambiguates when venue+date+time alone collide.
        id: `${sourceId}-${date}-${parsedTime.replace(":", "")}-${slugify(venueName)}-${no}`,
        tier: "G3",
        venueName,
        venueAddress: venueAddress ?? "",
        date,
        time: parsedTime,
        capacity: parseCapacity(capacityRaw ?? ""),
        registrationMethod: method,
        ageCategory: ageCategory ?? "",
        sourceUrl: `https://docs.google.com/spreadsheets/d/${sheetId}`,
        results: null,
      };
    } catch (err) {
      console.warn(`Skipping row ${no} (${venueName}): ${err instanceof Error ? err.message : err}`);
      continue;
    }

    const validated = eventSchema.safeParse(candidate);
    if (!validated.success) {
      console.warn(
        `Skipping row ${no} (${venueName}): ${validated.error.issues.map((i) => i.message).join("; ")}`,
      );
      continue;
    }

    events.push(validated.data);
  }

  return events;
}

async function main() {
  const allEvents: Event[] = [];

  for (const sheet of SHEETS) {
    console.log(`Fetching ${sheet.id}...`);
    const csv = await fetchCsv(sheet.sheetId, sheet.gid);
    const events = parseSheet(csv, sheet.id, sheet.sheetId, sheet.year);
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
