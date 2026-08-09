/**
 * Every outbound link on this site comes from ingested data — Stock Listing
 * product URLs scraped from retailers, Evidence Source and Discovery Source
 * URLs imported from HackMD and LINE. Rendering one straight into `href`
 * makes any upstream page (or a bad row in the database) able to plant
 * `javascript:` in the DOM of this one.
 *
 * Zod's `z.url()` does not close this: it accepts every well-formed URL,
 * including `javascript:` and `data:`, so the schemas are not the check.
 * This is, and it runs at render time — the last point before the value
 * becomes an attribute.
 */

const SAFE_PROTOCOLS = new Set(["http:", "https:", "mailto:"]);

/**
 * Returns the URL when it is safe to put in an `href`, or `undefined` when it
 * is not. Callers render plain text instead of a link on `undefined`, which
 * keeps a poisoned row visible rather than silently dropping the source.
 */
export function safeExternalUrl(raw: string | null | undefined): string | undefined {
  if (!raw) return undefined;
  const trimmed = raw.trim();
  // Relative links stay usable: they cannot carry a protocol payload, and
  // a protocol-relative `//host` would inherit ours, which is fine.
  if (trimmed.startsWith("/")) return trimmed;
  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return undefined;
  }
  return SAFE_PROTOCOLS.has(parsed.protocol) ? parsed.toString() : undefined;
}

/**
 * A zod-compatible refinement for the ingest side, so a bad URL is rejected
 * when data is written as well as when it is read.
 */
export function isSafeExternalUrl(raw: string): boolean {
  return safeExternalUrl(raw) !== undefined;
}
