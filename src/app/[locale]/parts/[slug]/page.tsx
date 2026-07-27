import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { useTranslations } from "next-intl";
import { routing, type Locale } from "@/i18n/routing";
import { requireLocale } from "@/i18n/require-locale.ts";
import { Link } from "@/i18n/navigation.ts";
import { getAllParts, getPartBySlug, getPartImage } from "@/lib/parts/repository.ts";
import { localizedNameOf } from "@/lib/parts/localized-name.ts";
import { formatWeightRange, weightRangeOf } from "@/lib/parts/part-weight.ts";
import { slugify } from "@/lib/parts/slug.ts";
import { BladeSilhouette } from "@/components/blade-silhouette.tsx";
import { RatchetSilhouette } from "@/components/ratchet-silhouette.tsx";
import { BitSilhouette } from "@/components/bit-silhouette.tsx";
import { MoldBatchVariants } from "@/components/mold-batch-variants.tsx";
import { DiscussionList } from "@/components/discussion-list.tsx";
import { AssessmentTracer } from "@/components/assessment-tracer.tsx";
import { WhereToBuyList } from "@/components/where-to-buy-list.tsx";
import { createNeonThreadReader } from "@/lib/discussion/neon-repository.ts";
import { createNeonStockListingReader } from "@/lib/stock/neon-store.ts";
import type { ThreadWithAuthor } from "@/lib/discussion/sql-repository.ts";
import { getAssessmentsForSubject } from "@/lib/assessments/repository.ts";
import { localizedSeoCopy, pageMetadata } from "@/lib/seo.ts";
import { parseAssessmentPaginationParams } from "@/lib/assessments/pagination.ts";
import { splitAssessmentsByStage } from "@/lib/parts/detail-sections.ts";
import { wingCountFor, hasObservedWingCount } from "@/lib/parts/blade-wing-count.ts";
import type { Part } from "@/lib/parts/schema.ts";
import type { AssessmentKind } from "@/lib/assessments/schema.ts";
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

const STAT_FIELDS = ["attack", "defense", "stamina", "xDash", "burstResistance"] as const;

export default async function PartDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale, slug } = await requireLocale(params);

  const part = getPartBySlug(slug);
  if (!part) notFound();

  const connectionString = process.env.DATABASE_URL;
  const threadReader = connectionString ? createNeonThreadReader(connectionString) : undefined;
  const threads = threadReader ? await threadReader.listVisibleBySubject("part", part.id) : [];
  const stockReader = connectionString ? createNeonStockListingReader(connectionString) : undefined;
  const listings = stockReader ? await stockReader.listByPartId(part.id) : [];

  const allAssessments = getAssessmentsForSubject("part", part.id);
  const stages = splitAssessmentsByStage(allAssessments);
  const pagination = parseAssessmentPaginationParams(await searchParams, stages.assessment.length);

  return (
    <PartDetailBody
      part={part}
      locale={locale}
      threads={threads}
      assessments={stages.assessment.slice(pagination.start, pagination.end)}
      physicalAssessments={stages.physical}
      listings={listings}
      pagination={{ ...pagination, pathname: `/${locale}/parts/${slug}` }}
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
  pagination,
}: {
  part: Part;
  locale: Locale;
  threads: ThreadWithAuthor[];
  assessments: ReturnType<typeof getAssessmentsForSubject>;
  physicalAssessments: ReturnType<typeof getAssessmentsForSubject>;
  listings: Awaited<ReturnType<ReturnType<typeof createNeonStockListingReader>["listByPartId"]>>;
  pagination: ReturnType<typeof parseAssessmentPaginationParams> & { pathname: string };
}) {
  const weightRange = weightRangeOf(part);
  const t = useTranslations("PartDetailPage");
  const tp = useTranslations("PartsPage");
  const tw = useTranslations("WhereToBuyPage");
  const image = getPartImage(part.id);
  const modes = "modes" in part ? part.modes : [];
  const statEntries: [(typeof STAT_FIELDS)[number], number][] =
    part.type === "bit"
      ? STAT_FIELDS.map((field) => [field, part.stats[field]])
      : (["attack", "defense", "stamina"] as const).map((field) => [field, part.stats[field]]);

  const assessmentLabels = {
    kindLabel: (kind: AssessmentKind) => t(`assessment_kind_${kind}`),
    unattributed: t("assessment_unattributed"),
    excerpt: t("assessment_excerpt"),
    discoverySource: t("assessment_discovery_source"),
    evidenceSource: t("assessment_evidence_source"),
    capturedAt: t("assessment_captured_at"),
    pageSize: t("assessment_page_size"),
    pageStatus: (page: number, totalPages: number) => t("assessment_page_status", { page, totalPages }),
    previousPage: t("assessment_previous_page"),
    nextPage: t("assessment_next_page"),
  };

  return (
    <main className={styles.page}>
      <p className={styles.backLink}><Link href="/parts">{t("back_to_parts")}</Link></p>

      <section className={styles.identityStage} aria-labelledby="part-identity-heading">
        <div className={styles.identityCopy}>
          <p className={styles.typeLabel}>{tp(`type_${part.type}`)}</p>
          <h1 id="part-identity-heading">{localizedNameOf(part, locale)}</h1>
          <p className={styles.code}>{part.id}</p>

          {/* The numbers a player came for, in the first screen. They used to
              start below the fold, under a heading, while the header block
              above them held nothing but a name and empty space. */}
          <dl className={styles.headlineSpec}>
            {statEntries.map(([field, value]) => (
              <div key={field}>
                <dt>{tp(`stat_${field}`)}</dt>
                <dd>{value}</dd>
              </div>
            ))}
            {weightRange ? (
              <div>
                <dt>{tp("weight_column")}</dt>
                <dd>{formatWeightRange(weightRange)}</dd>
              </div>
            ) : null}
          </dl>
        </div>
        <div className={styles.partVisual}>
          {image ? (
            /* This photo is the page's subject and sits above the fold;
               lazy-loading it meant the first thing a reader looks for was
               the last thing to arrive. */
            <Image src={image.url} alt={part.nameEn} width={image.width} height={image.height} priority />
          ) : part.type === "blade" && hasObservedWingCount(part.id) ? (
            <BladeSilhouette wingCount={wingCountFor(part.id)} label={tp("silhouette_label", { count: wingCountFor(part.id) })} />
          ) : part.type === "ratchet" ? (
            <RatchetSilhouette height={part.height} label={tp("silhouette_ratchet_label", { height: part.height })} />
          ) : part.type === "bit" && part.playstyle ? (
            <BitSilhouette playstyle={part.playstyle} label={tp(`silhouette_bit_${part.playstyle}`)} />
          ) : null}
          <p>{image ? t("image_disclaimer") : t("image_missing")}</p>
        </div>
      </section>

      <section className={styles.officialStage} aria-labelledby="official-facts-heading">
        <h2 id="official-facts-heading">{t("official_heading")}</h2>
        <dl className={styles.names}>
          <dt>{t("name_en")}</dt><dd>{part.nameEn}</dd>
          <dt>{t("name_ja")}</dt><dd>{part.nameJa ?? "—"}</dd>
          <dt>{t("name_zh_tw")}</dt><dd>{part.nameZhTw ?? "—"}</dd>
        </dl>
        {part.aliases.length > 0 ? <p>{t("aliases_label")}: {part.aliases.join("、")}</p> : null}
        <h2>{t("stats_heading")}</h2>
        <dl className={styles.stats}>
          {statEntries.map(([field, value]) => <div key={field}><dt>{tp(`stat_${field}`)}</dt><dd className="stat-value">{value}</dd></div>)}
        </dl>
        <h2>{t("mode_heading")}</h2>
        {modes.length > 0 ? <ul className={styles.modeList}>{modes.map((mode) => <li key={mode.label}>{mode.label}</li>)}</ul> : <p>{t("mode_default")}</p>}
      </section>

      <section className={styles.assessmentStage}>
        <AssessmentTracer headingId="part-assessment-heading" assessments={assessments} labels={{ heading: t("assessments_heading"), ...assessmentLabels }} pagination={pagination} />
      </section>

      <section className={styles.physicalStage} aria-labelledby="part-physical-heading">
        {physicalAssessments.length > 0 ? <AssessmentTracer headingId="part-physical-heading" assessments={physicalAssessments} labels={{ heading: t("physical_heading"), ...assessmentLabels }} /> : <><h2 id="part-physical-heading">{t("physical_heading")}</h2><p>{t("physical_empty")}</p></>}
        {part.moldBatches.length > 0 ? <MoldBatchVariants batches={part.moldBatches} labels={{ heading: t("mold_batches_heading"), source: t("mold_batch_source") }} /> : null}
        <p><Link href="/mold-batches">{t("mold_batches_lookup")}</Link></p>
      </section>

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
