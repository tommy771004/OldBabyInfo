import { hasLocale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing, type Locale } from "./routing";

/**
 * Resolves a `[locale]` route's params, 404ing on anything that isn't one of
 * `routing.locales`.
 *
 * The layout's own `notFound()` can't be relied on to protect the pages under
 * it: layout and page render concurrently, so the page's work happens before
 * the 404 lands. A request for `/favicon.png` — a single segment with a dot,
 * which the middleware matcher deliberately skips — reaches the home page as
 * `locale === "favicon.png"` and used to 500 on the first locale-keyed lookup
 * (`LABEL[locale][playstyle]`) instead of 404ing.
 *
 * Returns the params with `locale` narrowed to `Locale`, so a page never has
 * to assert the cast, and calls `setRequestLocale` so static rendering keeps
 * working — every page under `[locale]` did that on the next line anyway.
 */
export async function requireLocale<Params extends { locale: string }>(
  params: Promise<Params>,
): Promise<Omit<Params, "locale"> & { locale: Locale }> {
  const resolved = await params;
  if (!hasLocale(routing.locales, resolved.locale)) {
    notFound();
  }

  setRequestLocale(resolved.locale);
  return { ...resolved, locale: resolved.locale };
}
