import Image from "next/image";
import { useTranslations } from "next-intl";
import type { Locale } from "@/i18n/routing";
import { getPartImage } from "@/lib/parts/repository.ts";
import { localizedNameOf } from "@/lib/parts/localized-name.ts";
import { formatWeightRange, weightRangeOf } from "@/lib/parts/part-weight.ts";
import { BladeSilhouette } from "@/components/blade-silhouette.tsx";
import { RatchetSilhouette } from "@/components/ratchet-silhouette.tsx";
import { BitSilhouette } from "@/components/bit-silhouette.tsx";
import { MoldBatchVariants } from "@/components/mold-batch-variants.tsx";
import { AssessmentTracer } from "@/components/assessment-tracer.tsx";
import { Link } from "@/i18n/navigation.ts";
import { wingCountFor, hasObservedWingCount } from "@/lib/parts/blade-wing-count.ts";
import type { Part } from "@/lib/parts/schema.ts";
import type { Assessment, AssessmentKind } from "@/lib/assessments/schema.ts";
import styles from "./part-detail.module.css";

const STAT_FIELDS = ["attack", "defense", "stamina", "xDash", "burstResistance"] as const;

/**
 * The Part's own facts — identity, official data, sourced assessments and
 * Mold Batch observations. All of it is static JSON, so it renders the same
 * on the full page and inside the catalog dialog; the two DB-backed stages
 * (stock listings, discussion) stay on the page only.
 *
 * `variant="dialog"` is the same record at dialog scale: the name one step
 * down from display-large, stages closer together, and the Stat tiles left
 * out because the headline spec two lines above already printed them.
 */
export function PartDetailCore({
  part,
  locale,
  assessments,
  physicalAssessments,
  variant = "page",
  headingId = "part-identity-heading",
}: {
  part: Part;
  locale: Locale;
  assessments: Assessment[];
  physicalAssessments: Assessment[];
  variant?: "page" | "dialog";
  headingId?: string;
}) {
  const weightRange = weightRangeOf(part);
  const t = useTranslations("PartDetailPage");
  const tp = useTranslations("PartsPage");
  const image = getPartImage(part.id);
  const modes = "modes" in part ? part.modes : [];
  const statEntries: [(typeof STAT_FIELDS)[number], number][] =
    part.type === "bit"
      ? STAT_FIELDS.map((field) => [field, part.stats[field]])
      : (["attack", "defense", "stamina"] as const).map((field) => [field, part.stats[field]]);
  const inDialog = variant === "dialog";

  const assessmentLabels = {
    kindLabel: (kind: AssessmentKind) => t(`assessment_kind_${kind}`),
    unattributed: t("assessment_unattributed"),
    excerpt: t("assessment_excerpt"),
    discoverySource: t("assessment_discovery_source"),
    evidenceSource: t("assessment_evidence_source"),
    capturedAt: t("assessment_captured_at"),
  };

  return (
    <div className={inDialog ? styles.dialogVariant : undefined}>
      <section className={styles.identityStage} aria-labelledby={headingId}>
        <div className={styles.identityCopy}>
          <p className={styles.typeLabel}>{tp(`type_${part.type}`)}</p>
          {inDialog
            ? <h2 id={headingId} className={styles.identityName}>{localizedNameOf(part, locale)}</h2>
            : <h1 id={headingId} className={styles.identityName}>{localizedNameOf(part, locale)}</h1>}
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
        {inDialog ? null : (
          <>
            <h2>{t("stats_heading")}</h2>
            <dl className={styles.stats}>
              {statEntries.map(([field, value]) => <div key={field}><dt>{tp(`stat_${field}`)}</dt><dd className="stat-value">{value}</dd></div>)}
            </dl>
          </>
        )}
        <h2>{t("mode_heading")}</h2>
        {modes.length > 0 ? <ul className={styles.modeList}>{modes.map((mode) => <li key={mode.label}>{mode.label}</li>)}</ul> : <p>{t("mode_default")}</p>}
      </section>

      <section className={styles.assessmentStage}>
        <AssessmentTracer headingId="part-assessment-heading" assessments={assessments} labels={{ heading: t("assessments_heading"), ...assessmentLabels }} />
      </section>

      <section className={styles.physicalStage} aria-labelledby="part-physical-heading">
        {physicalAssessments.length > 0 ? <AssessmentTracer headingId="part-physical-heading" assessments={physicalAssessments} labels={{ heading: t("physical_heading"), ...assessmentLabels }} /> : <><h2 id="part-physical-heading">{t("physical_heading")}</h2><p>{t("physical_empty")}</p></>}
        {part.moldBatches.length > 0 ? <MoldBatchVariants batches={part.moldBatches} labels={{ heading: t("mold_batches_heading"), source: t("mold_batch_source") }} /> : null}
        <p><Link href="/mold-batches">{t("mold_batches_lookup")}</Link></p>
      </section>
    </div>
  );
}
