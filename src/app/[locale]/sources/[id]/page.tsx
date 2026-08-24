import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { useTranslations } from "next-intl";
import { routing } from "@/i18n/routing";
import { requireLocale } from "@/i18n/require-locale.ts";
import { Link } from "@/i18n/navigation.ts";
import { getAllSourceDocuments, getSourceDocumentById } from "@/lib/source-documents/repository.ts";
import { safeExternalUrl } from "@/lib/security/external-url.ts";
import { pageMetadata } from "@/lib/seo.ts";

export function generateStaticParams() {
  return routing.locales.flatMap((locale) =>
    getAllSourceDocuments().map((document) => ({ locale, id: document.id })),
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}): Promise<Metadata> {
  const { locale, id } = await requireLocale(params);
  const document = getSourceDocumentById(id);
  if (!document) return {};
  return pageMetadata({
    locale,
    pathname: `/sources/${id}`,
    title: document.title,
    description: `${document.title} — ${document.publisher}. Source document captured by OldBabyInfo.`,
  });
}

export default async function SourceDocumentPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { id } = await requireLocale(params);
  const document = getSourceDocumentById(id);
  if (!document) notFound();

  return <SourceDocumentBody document={document} />;
}

function SourceDocumentBody({ document }: { document: NonNullable<ReturnType<typeof getSourceDocumentById>> }) {
  const t = useTranslations("SourceDocumentPage");
  // Ingested URLs at the last point before they become attributes — same
  // render-path rule as the events calendar. An unsafe value degrades to
  // plain text so the provenance stays visible.
  const licenseHref = safeExternalUrl(document.licenseUrl);
  const canonicalHref = safeExternalUrl(document.canonicalUrl);
  return (
    <main>
      <p><Link href="/parts">{t("back_to_parts")}</Link></p>
      <h1>{document.title}</h1>
      <p>{document.publisher}</p>
      <dl>
        <dt>{t("published_at")}</dt>
        <dd>{document.publishedAt ?? t("unknown")}</dd>
        <dt>{t("captured_at")}</dt>
        <dd>{document.capturedAt}</dd>
        <dt>{t("license")}</dt>
        <dd>{licenseHref ? <a href={licenseHref}>{document.licenseName}</a> : document.licenseName}</dd>
      </dl>
      <p>{canonicalHref ? <a href={canonicalHref}>{t("original_source")}</a> : document.canonicalUrl}</p>
      <article>{document.content}</article>
    </main>
  );
}
