import { notFound } from "next/navigation";
import { useTranslations } from "next-intl";
import type { Locale } from "@/i18n/routing";
import { requireLocale } from "@/i18n/require-locale.ts";
import { Link } from "@/i18n/navigation.ts";
import { DiagonalArrow } from "@/components/diagonal-arrow.tsx";
import { DetailDialog, DetailDialogActions } from "@/components/detail-dialog.tsx";
import { getPartBySlug } from "@/lib/parts/repository.ts";
import { getAssessmentsForSubject } from "@/lib/assessments/repository.ts";
import { splitAssessmentsByStage } from "@/lib/parts/detail-sections.ts";
import type { Part } from "@/lib/parts/schema.ts";
import { PartDetailCore } from "../../[slug]/part-detail-body.tsx";

/**
 * `/parts/[slug]` reached by a click inside `/parts`: the Part as a dialog
 * over the list. Static facts only — stock listings and discussion read the
 * database, and a dialog that waits on Neon is a dialog that feels broken.
 * Both are one link away on the full page, which is what a hard load of
 * this same URL renders.
 */
export default async function PartDetailModalPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await requireLocale(params);
  const part = getPartBySlug(slug);
  if (!part) notFound();

  const stages = splitAssessmentsByStage(getAssessmentsForSubject("part", part.id));

  return <PartDetailModal part={part} slug={slug} locale={locale} assessments={stages.assessment} physicalAssessments={stages.physical} />;
}

function PartDetailModal({
  part,
  slug,
  locale,
  assessments,
  physicalAssessments,
}: {
  part: Part;
  slug: string;
  locale: Locale;
  assessments: ReturnType<typeof getAssessmentsForSubject>;
  physicalAssessments: ReturnType<typeof getAssessmentsForSubject>;
}) {
  const t = useTranslations("PartDetailPage");
  const prefix = locale === "zh-TW" ? "" : `/${encodeURIComponent(locale)}`;

  return (
    // Keyed so a swap to another record inside the dialog remounts it: the
    // body's scroll position resets and focus lands on the close mark
    // again instead of on nothing (the link that was clicked is gone).
    <DetailDialog key={slug} closeLabel={t("dialog_close")} labelledBy="part-dialog-heading">
      <PartDetailCore
        part={part}
        locale={locale}
        assessments={assessments}
        physicalAssessments={physicalAssessments}
        variant="dialog"
        headingId="part-dialog-heading"
      />
      <DetailDialogActions>
        {/* A plain anchor: the full page is this very URL, and only a real
            navigation leaves the intercepting route. */}
        <a className="m3-button m3-button--text m3-state" href={`${prefix}/parts/${slug}`}>
          {t("dialog_full_page")} <DiagonalArrow />
        </a>
        <Link className="m3-button m3-button--text m3-state" href={`/parts/${slug}/where-to-buy`}>
          {t("where_to_buy")} <DiagonalArrow />
        </Link>
      </DetailDialogActions>
    </DetailDialog>
  );
}
