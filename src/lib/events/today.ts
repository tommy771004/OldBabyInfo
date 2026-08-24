/**
 * Today's calendar date in Taiwan, as an ISO `yyyy-mm-dd` string.
 *
 * The site's audience is Taiwanese (CONTEXT.md) and every Event date is a
 * local calendar date with no timezone of its own. Comparing those dates
 * against `new Date().toISOString().slice(0, 10)` — UTC — puts the boundary
 * at 08:00 Taipei time: an event happening "today" reads as upcoming for
 * eight hours after it started, which is exactly wrong for someone checking
 * before heading out. Formatting the instant *in* Asia/Taipei moves the flip
 * to local midnight.
 */
export function taipeiTodayIso(now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Taipei",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}
