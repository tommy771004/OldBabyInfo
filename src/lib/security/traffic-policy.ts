import type { RateLimitRule } from "./rate-limit.ts";
import type { UserAgentClass } from "./user-agent.ts";

/**
 * What a request is asking for, in terms of what it costs this site to give
 * away. The catalog class covers the pages carrying the asset that is hardest
 * to rebuild — Parts, their Stats and above all their Aliases (see
 * CONTEXT.md) — so it is the class a bulk extractor has to walk.
 */
export type TrafficClass =
  /** Part, Combo, Event and catalog pages: the data worth copying. */
  | "catalog"
  /** robots/sitemaps/llms.txt: the map a crawler starts from. */
  | "bulk-index"
  /** Auth endpoints, where the cost of abuse is credential-shaped, not data-shaped. */
  | "auth"
  /** Everything else: home, guides, styleguide, static pages. */
  | "default";

const MINUTE = 60_000;
const TEN_MINUTES = 10 * MINUTE;

/**
 * Two windows per class on purpose. The short one absorbs a normal browsing
 * burst (Next prefetches several routes as a page hydrates); the long one is
 * what a crawl actually trips, because a scraper's defining trait is not a
 * spike but a steady walk that never stops.
 */
const BASE_RULES: Record<TrafficClass, readonly RateLimitRule[]> = {
  catalog: [
    { limit: 90, windowMs: MINUTE },
    { limit: 600, windowMs: TEN_MINUTES },
  ],
  "bulk-index": [
    { limit: 20, windowMs: MINUTE },
    { limit: 60, windowMs: TEN_MINUTES },
  ],
  auth: [
    { limit: 20, windowMs: MINUTE },
    { limit: 60, windowMs: TEN_MINUTES },
  ],
  default: [
    { limit: 120, windowMs: MINUTE },
    { limit: 900, windowMs: TEN_MINUTES },
  ],
};

/**
 * Multipliers, not bypasses. A self-declared Googlebot gets room to index the
 * whole catalog in one pass; a forged one gets four times a human's budget and
 * still hits a wall. An unidentified client gets a quarter — enough for an
 * uptime check, not enough for a crawl.
 */
const CLASS_MULTIPLIER: Record<UserAgentClass, number> = {
  "search-crawler": 4,
  browser: 1,
  unidentified: 0.25,
  // Refused before they reach the limiter; kept here so the record is total.
  harvester: 0,
  scripted: 0,
};

const CATALOG_PREFIXES = [
  "/parts",
  "/combo",
  "/meta",
  "/events",
  "/mold-batches",
  "/discussion",
  "/sources",
  "/guides",
];

const LOCALE_PREFIXES = ["/ja", "/en"];

/** Strips the optional locale prefix so `/ja/parts` classifies like `/parts`. */
export function withoutLocalePrefix(pathname: string): string {
  for (const prefix of LOCALE_PREFIXES) {
    if (pathname === prefix) return "/";
    if (pathname.startsWith(`${prefix}/`)) return pathname.slice(prefix.length);
  }
  return pathname;
}

export function trafficClassFor(pathname: string): TrafficClass {
  if (pathname.startsWith("/api/auth")) return "auth";
  if (
    pathname === "/robots.txt" ||
    pathname === "/sitemap.xml" ||
    pathname === "/llms.txt" ||
    pathname.startsWith("/sitemaps/")
  ) {
    return "bulk-index";
  }

  const path = withoutLocalePrefix(pathname);
  if (CATALOG_PREFIXES.some((prefix) => path === prefix || path.startsWith(`${prefix}/`))) {
    return "catalog";
  }
  return "default";
}

export function rulesFor(trafficClass: TrafficClass, uaClass: UserAgentClass): RateLimitRule[] {
  const multiplier = CLASS_MULTIPLIER[uaClass];
  return BASE_RULES[trafficClass].map((rule) => ({
    windowMs: rule.windowMs,
    // Never below 5: a throttled-to-nothing budget would turn a mis-detected
    // browser into a hard block, which is the one failure mode users notice.
    limit: Math.max(5, Math.round(rule.limit * multiplier)),
  }));
}

/**
 * Paths that exist only to be crawled into. `robots.txt` disallows them and
 * nothing on the site links to them in a way a person can reach, so a request
 * here is a client that fetched robots.txt to find what was hidden, or one
 * that parsed raw HTML and followed a link no browser renders.
 */
export const SCRAPE_TRAP_PATHS = ["/internal/parts-export"] as const;

/** How long a trap hit costs the caller, across every class. */
export const SCRAPE_TRAP_PENALTY_MS = 15 * MINUTE;

export function isScrapeTrap(pathname: string): boolean {
  const path = withoutLocalePrefix(pathname).replace(/\/+$/, "") || "/";
  return SCRAPE_TRAP_PATHS.some((trap) => path === trap);
}
