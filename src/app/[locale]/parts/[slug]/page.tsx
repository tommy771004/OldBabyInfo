import Image from "next/image";
import { notFound } from "next/navigation";
import { useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { routing, type Locale } from "@/i18n/routing";
import { Link } from "@/i18n/navigation.ts";
import { getAllParts, getPartBySlug, getPartImage } from "@/lib/parts/repository.ts";
import { localizedNameOf } from "@/lib/parts/localized-name.ts";
import { slugify } from "@/lib/parts/slug.ts";
import { BladeSilhouette } from "@/components/blade-silhouette.tsx";
import { RatchetSilhouette } from "@/components/ratchet-silhouette.tsx";
import { BitSilhouette } from "@/components/bit-silhouette.tsx";
import { MoldBatchVariants } from "@/components/mold-batch-variants.tsx";
import { DiscussionList } from "@/components/discussion-list.tsx";
import { createNeonThreadReader } from "@/lib/discussion/neon-repository.ts";
import type { ThreadWithAuthor } from "@/lib/discussion/sql-repository.ts";
import { wingCountFor, hasObservedWingCount } from "@/lib/parts/blade-wing-count.ts";
import type { Part } from "@/lib/parts/schema.ts";

export const dynamic = "force-dynamic";

export function generateStaticParams() {
  return routing.locales.flatMap((locale) =>
    getAllParts().map((part) => ({ locale, slug: slugify(part.nameEn) })),
  );
}

const STAT_FIELDS = ["attack", "defense", "stamina", "xDash", "burstResistance"] as const;

export default async function PartDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  // Safe: the root layout already 404s on any locale outside `routing.locales`.
  const { locale, slug } = (await params) as { locale: Locale; slug: string };
  setRequestLocale(locale);

  const part = getPartBySlug(slug);
  if (!part) notFound();

  const connectionString = process.env.DATABASE_URL;
  const threadReader = connectionString ? createNeonThreadReader(connectionString) : undefined;
  const threads = threadReader
    ? await threadReader.listVisibleBySubject("part", part.id)
    : [];

  return <PartDetailBody part={part} locale={locale} threads={threads} />;
}

function PartDetailBody({
  part,
  locale,
  threads,
}: {
  part: Part;
  locale: Locale;
  threads: ThreadWithAuthor[];
}) {
  const t = useTranslations("PartDetailPage");
  const tp = useTranslations("PartsPage");
  const image = getPartImage(part.id);
  const statEntries: [(typeof STAT_FIELDS)[number], number][] =
    part.type === "bit"
      ? STAT_FIELDS.map((field) => [field, part.stats[field]])
      : (["attack", "defense", "stamina"] as const).map((field) => [field, part.stats[field]]);

  return (
    <main>
      <p>
        <Link href="/parts">{t("back_to_parts")}</Link>
      </p>

      <p>{tp(`type_${part.type}`)}</p>
      <h1>{localizedNameOf(part, locale)}</h1>

      <div>
        {part.type === "blade" ? (
          hasObservedWingCount(part.id) ? (
            <BladeSilhouette
              wingCount={wingCountFor(part.id)}
              label={tp("silhouette_label", { count: wingCountFor(part.id) })}
            />
          ) : null
        ) : part.type === "ratchet" ? (
          <RatchetSilhouette
            height={part.height}
            label={tp("silhouette_ratchet_label", { height: part.height })}
          />
        ) : part.playstyle ? (
          <BitSilhouette playstyle={part.playstyle} label={tp(`silhouette_bit_${part.playstyle}`)} />
        ) : null}
      </div>

      <section>
        <h2>{t("names_heading")}</h2>
        <dl>
          <dt>{t("name_en")}</dt>
          <dd>{part.nameEn}</dd>
          <dt>{t("name_ja")}</dt>
          <dd>{part.nameJa ?? "—"}</dd>
          <dt>{t("name_zh_tw")}</dt>
          <dd>{part.nameZhTw ?? "—"}</dd>
        </dl>

        {part.aliases.length > 0 ? (
          <p>
            {t("aliases_label")}: {part.aliases.join("、")}
          </p>
        ) : null}
      </section>

      <section>
        <h2>{t("stats_heading")}</h2>
        <dl>
          {statEntries.map(([field, value]) => (
            <div key={field}>
              <dt>{tp(`stat_${field}`)}</dt>
              <dd className="stat-value">{value}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section>
        <h2>{t("release_label")}</h2>
        <p>{part.releaseAt ?? t("release_unknown")}</p>
      </section>

      {part.moldBatches.length > 0 ? (
        <MoldBatchVariants
          batches={part.moldBatches}
          labels={{ heading: t("mold_batches_heading"), source: t("mold_batch_source") }}
        />
      ) : null}

      <p>
        <Link href="/mold-batches">{t("mold_batches_lookup")}</Link>
      </p>
      <p>
        <Link href={`/parts/${slugify(part.nameEn)}/where-to-buy`}>{t("where_to_buy")}</Link>
      </p>

      <section>
        {image ? (
          <>
            <Image
              src={image.url}
              alt={part.nameEn}
              width={image.width}
              height={image.height}
              style={{ width: "auto", height: "auto", maxWidth: 400 }}
            />
            <p>{t("image_disclaimer")}</p>
          </>
        ) : (
          <p>{t("image_missing")}</p>
        )}
      </section>

      <section>
        <DiscussionList
          threads={threads.map(({ thread }) => thread)}
          authorNames={Object.fromEntries(threads.map(({ thread, authorName }) => [thread.authorId, authorName]))}
          labels={{
            heading: t("thread_heading"),
            emptyHeading: t("thread_empty_heading"),
            emptyBody: t("thread_empty_body"),
            postedBy: t("thread_posted_by"),
            noAuthor: t("thread_no_author"),
            at: t("thread_at"),
          }}
        />
      </section>
    </main>
  );
}
