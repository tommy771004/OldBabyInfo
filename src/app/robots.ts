import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/seo.ts";
import { SCRAPE_TRAP_PATHS } from "@/lib/security/traffic-policy.ts";

/**
 * Two audiences, stated separately.
 *
 * Search and answer engines stay fully welcome — being findable, including
 * inside AI answers, is how a hobby reference site gets read at all. What is
 * refused is the commercial crawl-and-resell tier, which takes the Alias
 * corpus and the Meta Standings and returns nothing.
 *
 * This file is a request, not a control: only well-behaved clients read it.
 * The enforcement counterpart lives in `src/middleware.ts`, and the trap paths
 * below are the bridge between the two — disallowed here, and refused there,
 * so a client that reads robots.txt in order to find what is hidden marks
 * itself.
 */
const HARVESTERS = [
  "AhrefsBot",
  "SemrushBot",
  "MJ12bot",
  "DotBot",
  "DataForSeoBot",
  "BLEXBot",
  "SerpstatBot",
  "PetalBot",
  "Bytespider",
  "ImagesiftBot",
  "magpie-crawler",
  "Barkrowler",
  "ZoominfoBot",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: [
          "*",
          "Googlebot",
          "Bingbot",
          "GPTBot",
          "ChatGPT-User",
          "PerplexityBot",
          "ClaudeBot",
          "anthropic-ai",
          "Google-Extended",
        ],
        allow: "/",
        disallow: [
          ...SCRAPE_TRAP_PATHS,
          "/api/",
          // Faceted and comparison URLs multiply into a near-infinite crawl
          // space over the same records. The canonical pages carry the data.
          "/*?with=",
          "/*?q=",
          "/*?page=",
          // Stock Listings are perishable snapshots (CONTEXT.md); an indexed
          // copy of one is a wrong price with this site's name on it.
          "/parts/*/where-to-buy",
          "/*/parts/*/where-to-buy",
        ],
      },
      { userAgent: HARVESTERS, disallow: "/" },
    ],
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}
