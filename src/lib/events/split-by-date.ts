import type { Event } from "./schema.ts";

/**
 * `today` is injected (ISO date string) rather than read from `Date.now()`
 * internally, so the split is deterministic and testable — the page passes
 * the real current date at request/build time.
 */
export function splitByDate(
  events: Event[],
  today: string,
): { upcoming: Event[]; past: Event[] } {
  const upcoming = events
    .filter((e) => e.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date));
  const past = events
    .filter((e) => e.date < today)
    .sort((a, b) => b.date.localeCompare(a.date));

  return { upcoming, past };
}
