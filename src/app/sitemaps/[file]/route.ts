import {
  buildUrlSetXml,
  SITEMAP_FILES,
  sitemapEntriesFor,
} from "@/lib/sitemap-documents.ts";

export const dynamicParams = false;

export function generateStaticParams() {
  return SITEMAP_FILES.map((file) => ({ file }));
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ file: string }> },
): Promise<Response> {
  const { file } = await params;
  const entries = sitemapEntriesFor(file);
  if (!entries) {
    return new Response("Sitemap not found", { status: 404 });
  }
  return new Response(buildUrlSetXml(entries), {
    headers: {
      "content-type": "application/xml; charset=utf-8",
      "cache-control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
