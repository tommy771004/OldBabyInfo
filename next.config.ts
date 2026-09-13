import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";
import legacyRedirects from "./data/legacy-part-redirects.json" with { type: "json" };

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

/**
 * Part detail URLs are `slugify(nameEn)`, so a Part that is renamed or moved out
 * of `data/parts.json` leaves a live address behind. `merge-phstudy-parts.ts`
 * emits the map — the script that breaks the address owns the forward.
 *
 * `localePrefix: "as-needed"` means zh-TW is unprefixed while /ja and /en are
 * not, so each entry needs both shapes. These run before middleware, so a stale
 * link never reaches the locale rewrite as a 404.
 */
function partRedirects() {
  return legacyRedirects.flatMap(({ from, to }) => {
    // Catalog record ids hold a colon ("beybrew:master-…"), which path-to-regexp
    // would read as a route parameter in the destination.
    const destination = to.replace(/:/g, "%3A");
    return [
      { source: from, destination, permanent: true },
      { source: `/:locale(ja|en)${from}`, destination: `/:locale${destination}`, permanent: true },
    ];
  });
}

/**
 * Terms used to be its own route. The copy now sits at the foot of the home
 * page, so the old address forwards to that anchor. Temporary on purpose: a
 * 308 would be cached by browsers, and this is a layout decision, not a
 * renamed record.
 */
function termsRedirects() {
  return [
    { source: "/terms", destination: "/#terms", permanent: false },
    { source: "/:locale(ja|en)/terms", destination: "/:locale#terms", permanent: false },
  ];
}

const nextConfig: NextConfig = {
  // Part photos are served from public/parts, so Next does not need a remote
  // image host configuration.
  redirects: async () => [...termsRedirects(), ...partRedirects()],
};

export default withNextIntl(nextConfig);
