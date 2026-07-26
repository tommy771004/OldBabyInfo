import { notFound } from "next/navigation";
import { useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { routing, type Locale } from "@/i18n/routing";
import { Link } from "@/i18n/navigation.ts";
import { getAllSourceDocuments, getSourceDocumentById } from "@/lib/source-documents/repository.ts";

export function generateStaticParams() {
  return routing.locales.flatMap((locale) =>
    getAllSourceDocuments().map((document) => ({ locale, id: document.id })),
  );
}

export default async function SourceDocumentPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = (await params) as { locale: Locale; id: string };
  setRequestLocale(locale);
  const document = getSourceDocumentById(id);
  if (!document) notFound();

  return <SourceDocumentBody document={document} />;
}

function SourceDocumentBody({ document }: { document: NonNullable<ReturnType<typeof getSourceDocumentById>> }) {
  const t = useTranslations("SourceDocumentPage");
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
        <dd>{document.licenseUrl ? <a href={document.licenseUrl}>{document.licenseName}</a> : document.licenseName}</dd>
      </dl>
      <p><a href={document.canonicalUrl}>{t("original_source")}</a></p>
      <article>{document.content}</article>
    </main>
  );
}
