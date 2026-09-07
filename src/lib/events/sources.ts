import { z } from "zod";

/**
 * Where the Event ingest reads from.
 *
 * These used to be a hardcoded array inside scripts/ingest-events.ts, with no
 * record of where either spreadsheet came from or what period it covered. That
 * mattered more than it looked: the organisers publish a NEW spreadsheet each
 * period rather than extending the old one, so on 2026-09-07 the pipeline was
 * still fetching two documents whose own titles say "7~8月" — reachable,
 * parsing cleanly, and incapable of ever returning another future session.
 * Swapping in the next period's sheet is a data edit now, not a code change.
 */
export const eventSourceSchema = z.object({
  /** Stable id; also the prefix of every Event id parsed from this sheet. */
  id: z.string().min(1),
  /** The spreadsheet's own title, so a maintainer can see at a glance which
   *  period a configured source actually covers. */
  label: z.string().min(1),
  sheetId: z.string().min(1),
  gid: z.string().regex(/^\d+$/),
  /** Rows in these sheets often write "7/11" with no year. */
  year: z.number().int(),
  coversFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  /** Last date this sheet can possibly describe. Past this, the source is
   *  spent and a new one has been published somewhere. */
  coversUntil: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  /** Where the publisher announces each period's sheet, when known. Recorded
   *  only where it has actually been confirmed — a guessed provenance URL is
   *  worse than an absent one. */
  publisherUrl: z.url().optional(),
});

export const eventSourcesFileSchema = z.array(eventSourceSchema).min(1);

export type EventSource = z.infer<typeof eventSourceSchema>;

/**
 * Sources whose period has already ended as of `today`.
 *
 * The ingest reports these rather than failing on them: a spent sheet still
 * holds the real past sessions the diff compares against, so dropping it would
 * read as "these events were deleted". What must not happen is the quiet
 * version — every configured source expired, the run green, and nobody
 * noticing for a month.
 */
export function expiredSources(sources: EventSource[], today: string): EventSource[] {
  return sources.filter((source) => source.coversUntil < today);
}

/** True when no configured source can still describe an upcoming session. */
export function everySourceExpired(sources: EventSource[], today: string): boolean {
  return sources.length > 0 && expiredSources(sources, today).length === sources.length;
}
