/**
 * How a request identifies itself, from its `user-agent` alone.
 *
 * The classification is deliberately honest about what it can know: a
 * User-Agent string is self-reported and trivially forged, so it is used to
 * *size a budget*, never as proof of identity. Verifying Googlebot properly
 * needs a reverse DNS lookup, which middleware cannot do on the request path.
 * Consequently `search-crawler` grants a larger rate-limit allowance rather
 * than an unlimited bypass — a forged Googlebot header buys a scraper a
 * bigger bucket, not a free pass.
 */
export type UserAgentClass =
  /** Search engines and answer engines this site wants to be indexed by. */
  | "search-crawler"
  /** Commercial SEO/data-resale crawlers that take the catalog and give nothing back. */
  | "harvester"
  /** Generic HTTP libraries, site rippers and security scanners. */
  | "scripted"
  /** Missing or implausibly short — allowed, but on the tightest budget. */
  | "unidentified"
  /** Anything that looks like a real browser. */
  | "browser";

/**
 * Crawlers `robots.ts` explicitly welcomes, plus the social/chat fetchers that
 * render link previews. LINE matters more than usual here: the Taiwanese
 * player community shares this site inside LINE groups, and a throttled
 * preview fetch shows up as a broken card.
 */
const SEARCH_CRAWLERS =
  /(googlebot|google-extended|storebot-google|google-inspectiontool|bingbot|applebot|duckduckbot|gptbot|chatgpt-user|oai-searchbot|perplexitybot|claudebot|claude-web|anthropic-ai|facebookexternalhit|twitterbot|linebot|line-poker|linespider|slackbot|telegrambot|discordbot|whatsapp)/i;

/**
 * Crawlers whose product is reselling other people's data. Blocking them is
 * the cheapest half of anti-scraping: they announce themselves truthfully, so
 * a name match is enough, and the Alias corpus is exactly what they harvest.
 */
const HARVESTERS =
  /(ahrefsbot|semrushbot|mj12bot|dotbot|dataforseobot|blexbot|serpstatbot|petalbot|bytespider|imagesiftbot|magpie-crawler|seekport|zoominfobot|barkrowler|sogou|megaindex|linkdexbot|seokicks|sistrix|screaming\s?frog)/i;

/**
 * Generic HTTP clients, mirroring tools and attack tooling. Headless browser
 * signatures are deliberately absent: this repo's own smoke journey drives
 * Playwright's Chromium, and preview/screenshot services use headless Chrome
 * too, so that signal produces more false positives than it is worth.
 */
const SCRIPTED_CLIENTS =
  /(python-requests|python-urllib|aiohttp|httpx|scrapy|node-fetch|axios|okhttp|libwww-perl|lwp::simple|mechanize|httrack|webcopier|webzip|teleport ?pro|offline explorer|sitesucker|wget|curl|go-http-client|guzzlehttp|apache-httpclient|winhttp|java|jakarta|ruby|perl|zgrab|masscan|nmap|nikto|sqlmap|nuclei|dirbuster|gobuster|feroxbuster|wpscan|acunetix|nessus|burpsuite|hydra)/i;

/** Shorter than this and the string cannot plausibly be a browser's. */
const MIN_PLAUSIBLE_LENGTH = 12;

export function classifyUserAgent(userAgent: string | null | undefined): UserAgentClass {
  const value = userAgent?.trim() ?? "";
  // Order matters twice over. A forged UA often keeps a scanner's name inside
  // an otherwise browser-shaped string, so the hostile matches must win; and
  // they are tested before the length check because the honest ones are short
  // (`curl/8.7.1` is ten characters).
  if (SCRIPTED_CLIENTS.test(value)) return "scripted";
  if (HARVESTERS.test(value)) return "harvester";
  if (SEARCH_CRAWLERS.test(value)) return "search-crawler";
  if (value.length < MIN_PLAUSIBLE_LENGTH) return "unidentified";
  return "browser";
}

/** Classes refused outright rather than throttled. */
export function isRefusedClass(uaClass: UserAgentClass): boolean {
  return uaClass === "scripted" || uaClass === "harvester";
}
