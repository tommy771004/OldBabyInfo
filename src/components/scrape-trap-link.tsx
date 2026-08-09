import { SCRAPE_TRAP_PATHS } from "@/lib/security/traffic-policy.ts";

/**
 * A link that exists only in the HTML source.
 *
 * `hidden` keeps it out of the rendered page and out of the accessibility
 * tree, and `tabIndex={-1}` keeps it out of the keyboard order, so no person
 * — sighted, screen-reader or keyboard-only — can reach it. A client that
 * parses raw HTML and follows every `href` it finds has no such filter, and
 * the middleware treats a request to this path as what it is.
 *
 * `rel="nofollow"` is there so a well-behaved crawler that somehow ignores
 * robots.txt still has a second reason not to follow it.
 */
export function ScrapeTrapLink() {
  const trap = SCRAPE_TRAP_PATHS[0];
  return (
    <a href={trap} hidden aria-hidden="true" tabIndex={-1} rel="nofollow noindex">
      OldBabyInfo parts export
    </a>
  );
}
