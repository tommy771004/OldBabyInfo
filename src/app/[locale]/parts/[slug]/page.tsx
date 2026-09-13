import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { useTranslations } from "next-intl";
import { routing, type Locale } from "@/i18n/routing";
import { requireLocale } from "@/i18n/require-locale.ts";
import { Link } from "@/i18n/navigation.ts";
import { getAllParts, getPartBySlug } from "@/lib/parts/repository.ts";
import { localizedNameOf } from "@/lib/parts/localized-name.ts";
import { slugify } from "@/lib/parts/slug.ts";
import { DiscussionList } from "@/components/discussion-list.tsx";
import { WhereToBuyList } from "@/components/where-to-buy-list.tsx";
import { createNeonThreadReader } from "@/lib/discussion/neon-repository.ts";
import { createNeonStockListingReader } from "@/lib/stock/neon-store.ts";
import type { ThreadWithAuthor } from "@/lib/discussion/sql-repository.ts";
import { getAssessmentsForSubject } from "@/lib/assessments/repository.ts";
import { localizedSeoCopy, pageMetadata } from "@/lib/seo.ts";
import { optionalRead } from "@/lib/db/optional-read.ts";
import { splitAssessmentsByStage } from "@/lib/parts/detail-sections.ts";
import type { Part } from "@/lib/parts/schema.ts";
import { PartDetailCore } from "./part-detail-body.tsx";
import styles from "./part-detail.module.css";

export const dynamic = "force-dynamic";

export function generateStaticParams() {
  return routing.locales.flatMap((locale) =>
    getAllParts().map((part) => ({ locale, slug: slugify(part.nameEn) })),
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await requireLocale(params);
  const part = getPartBySlug(slug);
  if (!part) return {};

  const name = localizedNameOf(part, locale);
  const copy = localizedSeoCopy("parts", locale);
  return pageMetadata({
    locale,
    pathname: `/parts/${slug}`,
    title: `${name} · ${copy.title}`,
    description: `${name} — ${copy.description}`,
  });
}

export default async function PartDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await requireLocale(params);

  const part = getPartBySlug(slug);
  if (!part) notFound();

  const connectionString = process.env.DATABASE_URL;
  // Both panels are supplementary; the Part's own facts are static and always
  // render. See optional-read.ts for why this is not just a null check.
  const threadReader = connectionString ? createNeonThreadReader(connectionString) : undefined;
  const threads = threadReader
    ? await optionalRead("part discussion threads", () => threadReader.listVisibleBySubject("part", part.id), [])
    : [];
  const stockReader = connectionString ? createNeonStockListingReader(connectionString) : undefined;
  const listings = stockReader
    ? await optionalRead("part stock listings", () => stockReader.listByPartId(part.id), [])
    : [];

  // Every assessment renders: a Part has a handful at most, and the paging
  // controls that used to sit under them only ever said "第 1 / 1 頁".
  const stages = splitAssessmentsByStage(getAssessmentsForSubject("part", part.id));

  return (
    <PartDetailBody
      part={part}
      locale={locale}
      threads={threads}
      assessments={stages.assessment}
      physicalAssessments={stages.physical}
      listings={listings}
    />
  );
}

function PartDetailBody({
  part,
  locale,
  threads,
  assessments,
  physicalAssessments,
  listings,
}: {
  part: Part;
  locale: Locale;
  threads: ThreadWithAuthor[];
  assessments: ReturnType<typeof getAssessmentsForSubject>;
  physicalAssessments: ReturnType<typeof getAssessmentsForSubject>;
  listings: Awaited<ReturnType<ReturnType<typeof createNeonStockListingReader>["listByPartId"]>>;
}) {
  const t = useTranslations("PartDetailPage");
  const tw = useTranslations("WhereToBuyPage");

  return (
    <main className={styles.page}>
      <p className={styles.backLink}><Link href="/parts">{t("back_to_parts")}</Link></p>

      <PartDetailCore
        part={part}
        locale={locale}
        assessments={assessments}
        physicalAssessments={physicalAssessments}
      />

      <section className={styles.stockStage} aria-labelledby="where-to-buy-heading">
        <h2 id="where-to-buy-heading">{t("where_to_buy")}</h2>
        <WhereToBuyList listings={listings} labels={{
          price: tw("price"), availability: tw("availability"), inStock: tw("inStock"), outOfStock: tw("outOfStock"), unknownStock: tw("unknownStock"), capturedAt: tw("capturedAt"), visitRetailer: tw("visitRetailer"), emptyHeading: tw("emptyHeading"), emptyBody: tw("emptyBody"),
        }} />
        <p><Link href={`/parts/${slugify(part.nameEn)}/where-to-buy`}>{t("where_to_buy_full_page")}</Link></p>
      </section>

      <section className={styles.discussionStage}>
        <DiscussionList
          threads={threads.map(({ thread }) => thread)}
          authorNames={Object.fromEntries(threads.map(({ thread, authorName }) => [thread.authorId, authorName]))}
          labels={{ heading: t("thread_heading"), emptyHeading: t("thread_empty_heading"), emptyBody: t("thread_empty_body"), postedBy: t("thread_posted_by"), noAuthor: t("thread_no_author"), at: t("thread_at") }}
        />
      </section>
    </main>
  );
}
