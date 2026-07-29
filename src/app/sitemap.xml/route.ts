import { buildSitemapIndexXml } from "@/lib/sitemap-documents.ts";

export const dynamic = "force-static";

export function GET(): Response {
  return new Response(buildSitemapIndexXml(), {
    headers: {
      "content-type": "application/xml; charset=utf-8",
      "cache-control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
