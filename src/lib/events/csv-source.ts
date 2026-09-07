/**
 * Real, proven parsing for the Funbox/B4 G3 schedule sheets (ticket 31's
 * source) — extracted so both the manual seed script and ticket 32's
 * automated ingest share the exact same logic instead of two copies
 * silently drifting apart over time. Every quirk documented here (a
 * trailing-slash date typo, a capacity range, a missing year) is real
 * hand-entered source data ticket 31 actually found, not a hypothetical.
 */
import { eventSchema, type Event } from "./schema.ts";
import { parseStructuredExtraction } from "../extraction.ts";

export const REGISTRATION_METHOD: Record<string, Event["registrationMethod"]> = {
  現場: "onsite",
  線上: "online",
  電話: "phone",
  皆可: "either",
  門市社群: "store_community",
  // Both appeared in the 2026-9、10月 B4 sheet. Unmapped, they took every row
  // of 漢謚玩具社 and 雄大書局-鼎山店 with them — two Kaohsiung venues that
  // would simply not exist on the calendar. The field records the channel a
  // player registers through, so each maps to the channel it actually is:
  // registering on the store's Facebook is the store's own community page,
  // and an online draw is still registered online — "(抽選)" describes who
  // gets a place, not how the sign-up happens.
  FB報名: "store_community",
  "線上(抽選)": "online",
};

export async function fetchSheetCsv(sheetId: string, gid: string): Promise<string> {
  const url = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${gid}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch sheet ${sheetId}: ${res.status}`);
  return res.text();
}

/** Splits one CSV line into cells. Real cell content here never contains a
 *  comma (checked against the actual data) — the only quoted/multiline
 *  field is the trailing disclaimer, filtered out by the header/title-row
 *  check in parseSheetRow before this ever needs to handle a quote. A full
 *  CSV parser would be overkill for this source's actual shape. */
export function splitRow(line: string): string[] {
  return line.split(",").map((cell) => cell.trim());
}

/** "7/11" (no year, sheet's own period supplies it) or "2026/7/12"
 *  (already has one) — both appear across the two source sheets. A trailing
 *  slash typo ("2026/8/9/") is real, hand-entered source data, not
 *  something to special-case beyond dropping the resulting empty part. */
export function parseSheetDate(raw: string, fallbackYear: number): string {
  const parts = raw
    .split("/")
    .filter((p) => p.length > 0)
    .map(Number);
  if (parts.length === 0 || parts.some((n) => !Number.isFinite(n))) {
    throw new Error(`Unparseable date: "${raw}"`);
  }
  const [a, b, c] = parts;
  const [year, month, day] = parts.length === 3 ? [a!, b!, c!] : [fallbackYear, a!, b!];
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

/** One real row had "32-48" (a range) instead of a single number — take
 *  the lower bound, the same number a walk-in registrant would be quoted. */
export function parseSheetCapacity(raw: string): number {
  const match = raw.match(/\d+/);
  if (!match) throw new Error(`Unparseable capacity: "${raw}"`);
  return Number(match[0]);
}

/** "9:00" is common (no leading zero); the schema requires zero-padded
 *  HH:MM so stored times sort and compare consistently. */
export function parseSheetTime(raw: string): string {
  const match = raw.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) throw new Error(`Unparseable time: "${raw}"`);
  return `${match[1]!.padStart(2, "0")}:${match[2]}`;
}

export function slugifySheetVenue(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "");
}

export interface SheetRowResult {
  status: "parsed" | "skipped_header" | "failed";
  /** The raw CSV line — kept alongside the parsed Event as its excerpt
   *  (ticket 32: "附 Source Excerpt"). Present whenever the row was at
   *  least a real data row (parsed or failed), not for header/blank rows. */
  rawRow?: string;
  event?: Event;
  reason?: string;
}

/**
 * Parses one CSV line into an Event, or reports why it couldn't. Never
 * throws — every outcome (including "this wasn't a data row at all") is a
 * real return value, so a caller can tell a structural format break
 * (many `failed` rows) apart from routine header/blank lines
 * (`skipped_header`, always present, never a signal of anything wrong).
 */
export function parseSheetRow(
  line: string,
  sourceId: string,
  sheetId: string,
  year: number,
): SheetRowResult {
  const cells = splitRow(line);
  const [no, venueName, , venueAddress, dateRaw, time, capacityRaw, methodRaw, ageCategory] = cells;

  if (!no || !/^\d+$/.test(no)) return { status: "skipped_header" };
  if (!venueName || !dateRaw || !time) return { status: "skipped_header", rawRow: line };

  const method = REGISTRATION_METHOD[methodRaw ?? ""];
  if (!method) {
    return { status: "failed", rawRow: line, reason: `unknown registration method "${methodRaw}"` };
  }

  let candidate: Event;
  try {
    const date = parseSheetDate(dateRaw, year);
    const parsedTime = parseSheetTime(time);
    candidate = {
      // Same venue/time can host multiple age-bracket sessions — the row
      // number disambiguates when venue+date+time alone collide.
      id: `${sourceId}-${date}-${parsedTime.replace(":", "")}-${slugifySheetVenue(venueName)}-${no}`,
      tier: "G3",
      venueName,
      venueAddress: venueAddress ?? "",
      date,
      time: parsedTime,
      capacity: parseSheetCapacity(capacityRaw ?? ""),
      registrationMethod: method,
      ageCategory: ageCategory ?? "",
      sourceUrl: `https://docs.google.com/spreadsheets/d/${sheetId}`,
      results: null,
    };
  } catch (err) {
    return { status: "failed", rawRow: line, reason: err instanceof Error ? err.message : String(err) };
  }

  // Ticket 32: "半結構化表格的解析走 20 的抽取契約" — the final
  // validate-or-reject step goes through parseStructuredExtraction rather
  // than calling eventSchema directly, so this really is the deterministic
  // extraction contract ticket 20 built, not just an equivalent
  // reimplementation. The validate function still formats Zod issues into
  // a readable message itself (rather than letting a raw ZodError's own
  // `.message` — a JSON blob — become the reason) so a human skimming the
  // ingest log sees "Invalid ISO date", not a wall of JSON.
  const outcome = parseStructuredExtraction(candidate, (v) => {
    const result = eventSchema.safeParse(v);
    if (!result.success) {
      throw new Error(result.error.issues.map((i) => i.message).join("; "));
    }
    return result.data;
  });
  if (outcome.status === "rejected") {
    return { status: "failed", rawRow: line, reason: outcome.reason };
  }

  return { status: "parsed", rawRow: line, event: outcome.value };
}

export function parseSheetCsv(
  csv: string,
  sourceId: string,
  sheetId: string,
  year: number,
): SheetRowResult[] {
  return csv.split("\n").map((line) => parseSheetRow(line, sourceId, sheetId, year));
}
