"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation.ts";
import { localizedNameOf } from "@/lib/parts/localized-name.ts";
import { slugify } from "@/lib/parts/slug.ts";
import { searchParts } from "@/lib/parts/search-parts.ts";
import { buildComboQuery, type ComboSlugs } from "@/lib/parts/combo-query.ts";
import { computeComboStats } from "@/lib/parts/combo-stats.ts";
import { PartSilhouette } from "@/components/part-silhouette.tsx";
import type { Locale } from "@/i18n/routing.ts";
import type { Part } from "@/lib/parts/schema.ts";
import styles from "./page.module.css";

type PartType = Part["type"];

/** Shown when the reader has typed nothing yet. Newest first — a fact about
 *  the parts, not a recommendation. This site deliberately publishes no
 *  "strongest combo" ranking (see the what-to-buy guide), so the one thing a
 *  default list may sort by is the release date it can actually cite. */
const SUGGESTION_COUNT = 6;

function byNewestRelease(left: Part, right: Part): number {
  return (right.releaseAt ?? "").localeCompare(left.releaseAt ?? "");
}

function currentSlugs(blade: Part | undefined, ratchet: Part | undefined, bit: Part | undefined): ComboSlugs {
  return {
    blade: blade ? slugify(blade.nameEn) : undefined,
    ratchet: ratchet ? slugify(ratchet.nameEn) : undefined,
    bit: bit ? slugify(bit.nameEn) : undefined,
  };
}

function SlotPicker({
  slotType,
  label,
  selected,
  slots,
  allParts,
  locale,
}: {
  slotType: PartType;
  label: string;
  selected: Part | undefined;
  slots: ComboSlugs;
  allParts: Part[];
  locale: Locale;
}) {
  const t = useTranslations("ComboBuilderPage");
  const [query, setQuery] = useState("");

  const ofType = useMemo(
    () => allParts.filter((part) => part.type === slotType),
    [allParts, slotType],
  );

  const searching = query.trim().length > 0;
  const candidates = useMemo(
    () =>
      searching
        ? searchParts(ofType, query).slice(0, 8)
        : [...ofType].sort(byNewestRelease).slice(0, SUGGESTION_COUNT),
    [ofType, query, searching],
  );

  if (selected) {
    return (
      <div className={`${styles.slot} ${styles.slotFilled} current-border`}>
        <p className={styles.slotLabel}>{label}</p>
        <div className={styles.selected}>
          <span className={styles.selectedMark} aria-hidden="true">
            <PartSilhouette part={selected} showPlaceholder={false} />
          </span>
          <span className={styles.selectedName}>{localizedNameOf(selected, locale)}</span>
        </div>
        <Link
          className={styles.clear}
          href={{
            pathname: "/combo",
            query: buildComboQuery({ ...slots, [slotType]: undefined }),
          }}
        >
          {t("clear")}
        </Link>
      </div>
    );
  }

  return (
    <div className={styles.slot}>
      <label className={styles.slotLabel}>
        <span>{label}</span>
        <input
          className={styles.search}
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={t("search_placeholder")}
        />
      </label>

      {/* Candidates are on screen before a single keystroke: three empty
          search boxes tell a newcomer nothing about what can go in them. */}
      <p className={styles.candidatesLabel}>
        {searching ? t("matches_heading") : t("recent_heading")}
      </p>
      {searching && candidates.length === 0 ? (
        <p className={styles.noMatches}>{t("no_matches")}</p>
      ) : (
        <ul className={styles.candidates}>
          {candidates.map((part) => (
            <li key={part.id}>
              <Link
                className={styles.candidate}
                href={{
                  pathname: "/combo",
                  query: buildComboQuery({ ...slots, [slotType]: slugify(part.nameEn) }),
                }}
              >
                <span className={styles.candidateMark} aria-hidden="true">
                  <PartSilhouette part={part} showPlaceholder={false} />
                </span>
                <span>{localizedNameOf(part, locale)}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function StatRow({
  label,
  value,
  primary = false,
}: {
  label: string;
  value: string | number;
  primary?: boolean;
}) {
  return (
    <div className={primary ? `${styles.statRow} ${styles.statPrimary}` : styles.statRow}>
      <dt className={styles.statLabel}>{label}</dt>
      <dd className={`${styles.statValue} stat-value`}>{value}</dd>
    </div>
  );
}

export function ComboBuilder({
  blade,
  ratchet,
  bit,
  allParts,
  locale,
}: {
  blade: Part | undefined;
  ratchet: Part | undefined;
  bit: Part | undefined;
  allParts: Part[];
  locale: Locale;
}) {
  const t = useTranslations("ComboBuilderPage");
  const tp = useTranslations("PartsPage");
  const slugs = currentSlugs(blade, ratchet, bit);
  const selectedCount = [blade, ratchet, bit].filter(Boolean).length;
  const stats = computeComboStats(blade, ratchet, bit);
  const weightNote = t("weight_note");

  // Nothing picked yet still shows the shape of the answer, so the page is
  // never a blank field below three inputs.
  const dash = "—";
  const show = (value: number) => (selectedCount > 0 ? value : dash);
  const bitOnly = (value: number) => (bit ? value : selectedCount > 0 ? t("bit_only_note") : dash);

  return (
    <>
      <div className={styles.builder}>
        <SlotPicker
          slotType="blade"
          label={t("blade_slot")}
          selected={blade}
          slots={slugs}
          allParts={allParts}
          locale={locale}
        />
        <SlotPicker
          slotType="ratchet"
          label={t("ratchet_slot")}
          selected={ratchet}
          slots={slugs}
          allParts={allParts}
          locale={locale}
        />
        <SlotPicker
          slotType="bit"
          label={t("bit_slot")}
          selected={bit}
          slots={slugs}
          allParts={allParts}
          locale={locale}
        />
      </div>

      <section className={styles.stats} aria-live="polite">
        <h2 className={styles.statsHeading}>{t("stats_heading")}</h2>
        {selectedCount === 0 ? (
          <p className={styles.statsHint}>{t("empty_stats_hint")}</p>
        ) : selectedCount < 3 ? (
          <p className={styles.statsHint}>{t("incomplete_notice")}</p>
        ) : null}

        <dl className={styles.statGrid}>
          <StatRow label={tp("stat_attack")} value={show(stats.attack)} primary />
          <StatRow label={tp("stat_defense")} value={show(stats.defense)} primary />
          <StatRow label={tp("stat_stamina")} value={show(stats.stamina)} primary />
          <StatRow label={tp("stat_xDash")} value={bitOnly(stats.xDash)} />
          <StatRow label={tp("stat_burstResistance")} value={bitOnly(stats.burstResistance)} />
        </dl>

        {weightNote ? <p className={styles.statsHint}>{weightNote}</p> : null}
      </section>
    </>
  );
}
