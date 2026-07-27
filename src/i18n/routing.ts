import { defineRouting } from "next-intl/routing";

/**
 * zh-TW is the default and unprefixed audience — the majority of players.
 * ja and en carry an explicit path prefix. See ADR-0005: search stays
 * cross-language regardless of which of these the UI is currently in.
 */
export const routing = defineRouting({
  locales: ["zh-TW", "ja", "en"],
  defaultLocale: "zh-TW",
  localePrefix: "as-needed",
  localeDetection: true,
});

export type Locale = (typeof routing.locales)[number];
