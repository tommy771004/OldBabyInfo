/**
 * The detail page's URL is the official English name, slugified (ticket
 * 16) — shareable and stable, unlike the internal `id` (which keeps
 * whatever casing/punctuation the source data happened to have, e.g.
 * "LIGHTNING L-DRAGO").
 */
export function slugify(nameEn: string): string {
  return nameEn
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
