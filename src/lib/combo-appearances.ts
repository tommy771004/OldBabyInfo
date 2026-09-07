import { z } from "zod";
import { comboKeyOf, parseComboKey } from "./meta-standing.ts";
import type { Part } from "./parts/schema.ts";

const text = z.string().trim().min(1);
const httpUrl = z.url().refine((value) => {
  try {
    const url = new URL(value);
    return ["http:", "https:"].includes(url.protocol) && !url.username && !url.password;
  } catch { return false; }
}, "An HTTP(S) evidence URL without credentials is required");

export const comboAppearanceRecordSchema = z.strictObject({
  eventId: text,
  /** Stable, source-backed entry/slot identifier, not a player's personal name.
   * The same observation across two sources must use the same entryId. */
  entryId: text,
  eventDate: z.iso.date().refine((date) => date >= "2023-07-15", "Cannot predate Beyblade X"),
  comboKey: text,
  placement: z.enum(["champion", "top8", "entrant", "unknown"]),
  sourceUrl: httpUrl,
  sourceExcerpt: text,
  capturedAt: z.iso.datetime(),
});
export type ComboAppearanceRecord = z.infer<typeof comboAppearanceRecordSchema>;

function identity(row: ComboAppearanceRecord) {
  return JSON.stringify([row.eventId, row.entryId]);
}

export const comboAppearancesFileSchema = z.array(comboAppearanceRecordSchema).superRefine((rows, ctx) => {
  const seen = new Set<string>();
  const dates = new Map<string, string>();
  for (const [index, row] of rows.entries()) {
    if (seen.has(identity(row))) ctx.addIssue({ code: "custom", path: [index], message: "Duplicate Event entry" });
    seen.add(identity(row));
    if (dates.has(row.eventId) && dates.get(row.eventId) !== row.eventDate) {
      ctx.addIssue({ code: "custom", path: [index, "eventDate"], message: "Conflicting Event dates" });
    }
    dates.set(row.eventId, row.eventDate);
  }
});

const decisionFields = { record: comboAppearanceRecordSchema };
export const comboAppearanceReviewsSchema = z.array(z.discriminatedUnion("decision", [
  z.strictObject({ ...decisionFields, decision: z.literal("pending") }),
  z.strictObject({ ...decisionFields, decision: z.literal("approved"), reviewedBy: text, reviewedAt: z.iso.datetime() }),
  z.strictObject({ ...decisionFields, decision: z.literal("rejected"), reviewedBy: text, reviewedAt: z.iso.datetime() }),
]));

/** Shared by offline import and the build-time repository. No guessed IDs. */
export function validateComboAppearances(input: unknown, parts: readonly Part[]): ComboAppearanceRecord[] {
  const rows = comboAppearancesFileSchema.parse(input);
  const byId = new Map(parts.map((part) => [part.id, part]));
  for (const row of rows) {
    const key = parseComboKey(row.comboKey);
    if (comboKeyOf(key.bladeId, key.ratchetId, key.bitId) !== row.comboKey ||
      byId.get(key.bladeId)?.type !== "blade" ||
      byId.get(key.ratchetId)?.type !== "ratchet" ||
      byId.get(key.bitId)?.type !== "bit") {
      throw new Error(`Unknown or wrong-slot Combo: ${row.comboKey}`);
    }
  }
  return rows;
}

/** Existing historical rows survive removal from the rotating Event calendar.
 * New rows must match an explicitly supplied, source-verified Event index. */
export function mergeComboAppearanceReviews(
  previous: unknown,
  input: unknown,
  parts: readonly Part[],
  events: readonly { id: string; date: string }[],
) {
  const rows = validateComboAppearances(previous, parts);
  const reviews = comboAppearanceReviewsSchema.parse(input);
  const eventDates = new Map<string, string>();
  for (const event of events) {
    if (eventDates.has(event.id)) throw new Error(`Duplicate reference Event: ${event.id}`);
    eventDates.set(event.id, event.date);
  }
  const byIdentity = new Map(rows.map((row) => [identity(row), row]));
  let added = 0;
  let unchanged = 0;
  for (const review of reviews) {
    if (review.decision !== "approved") continue;
    const row = review.record;
    const existing = byIdentity.get(identity(row));
    if (existing) {
      if (JSON.stringify(existing) !== JSON.stringify(row)) {
        throw new Error(`Conflicting Event entry: ${row.eventId} / ${row.entryId}`);
      }
      unchanged++;
      continue;
    }
    if (eventDates.get(row.eventId) !== row.eventDate) {
      throw new Error(`Unknown Event or mismatched date: ${row.eventId}`);
    }
    byIdentity.set(identity(row), row);
    added++;
  }
  return {
    records: validateComboAppearances([...byIdentity.values()], parts),
    added,
    unchanged,
    pending: reviews.filter((review) => review.decision === "pending").length,
    rejected: reviews.filter((review) => review.decision === "rejected").length,
  };
}
