"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import type { Locale } from "@/i18n/routing.ts";
import type { Part } from "@/lib/parts/schema.ts";
import { Link } from "@/i18n/navigation.ts";
import { localizedNameOf } from "@/lib/parts/localized-name.ts";
import { slugify } from "@/lib/parts/slug.ts";
import { buildCompareQuery } from "@/lib/parts/compare-query.ts";
import { COMPARE_STATS, compareStat, tugOfWar } from "@/lib/parts/compare-battle.ts";
import { CompareArena } from "./compare-arena.tsx";
import { AddPartSearch } from "./add-part-search.tsx";
import { compareCopy } from "./compare-copy.ts";
import styles from "./page.module.css";

function TugRow({ label, field, left, right, names, locale }: {
  label: string; field: string; left: number | undefined; right: number | undefined;
  names: string[]; locale: Locale;
}) {
  const signature = `${left ?? "—"}|${right ?? "—"}`;
  const previousSignature = useRef(signature);
  const currentRef = useRef<HTMLSpanElement | null>(null);
  const [pulse, setPulse] = useState<{ revision: number } | null>(null);
  useEffect(() => {
    if (previousSignature.current === signature) return;
    previousSignature.current = signature;
    setPulse((current) => ({ revision: (current?.revision ?? 0) + 1 }));
    const timeoutId = window.setTimeout(() => setPulse(null), 760);
    return () => window.clearTimeout(timeoutId);
  }, [signature]);
  useEffect(() => {
    const current = currentRef.current;
    if (!current) return;
    const finish = () => setPulse(null);
    current.addEventListener("animationend", finish);
    return () => current.removeEventListener("animationend", finish);
  }, [pulse]);
  const geometry = tugOfWar(left, right);
  const copy = compareCopy[locale];
  return (
    <div className={styles.tugRow} data-stat={field} data-lead={geometry?.lead ?? "none"}>
      <dt>{label}</dt>
      <dd className={styles.tugLeft} aria-label={`${names[0]}: ${left ?? copy.statUnavailable}`}>{left ?? "—"}</dd>
      <dd className={styles.tugRight} aria-label={`${names[1]}: ${right ?? copy.statUnavailable}`}>{right ?? "—"}</dd>
      <div className={styles.tugGeometry} aria-hidden="true">
        <svg viewBox="0 0 1000 20" preserveAspectRatio="none">
          <path d="M0 10H1000 M500 0V20" className={styles.tugAxis} />
          {geometry ? <>
            <path d={`M500 10H${500 - geometry.left * 10}`} className={styles.tugRailLeft} />
            <path d={`M500 10H${500 + geometry.right * 10}`} className={styles.tugRailRight} />
          </> : null}
        </svg>
        {geometry && pulse ? <span
          key={pulse.revision}
          data-current="true"
          className={styles.statCurrent}
          aria-hidden="true"
          style={{ left: `${50 - geometry.left}%`, width: `${geometry.left + geometry.right}%` }}
          ref={currentRef}
          onAnimationEnd={() => setPulse(null)}
        /> : null}
      </div>
      <span className={styles.axisLabel}>{geometry ? `${copy.axis} 0–${geometry.axis}` : copy.statUnavailable}</span>
    </div>
  );
}

export function CompareDuel({ parts, allParts, locale }: { parts: [Part, Part]; allParts: Part[]; locale: Locale }) {
  const t = useTranslations("ComparePage");
  const tp = useTranslations("PartsPage");
  const copy = compareCopy[locale];
  const slugs = parts.map((part) => slugify(part.nameEn));
  const names = parts.map((part) => localizedNameOf(part, locale));
  const arenaKey = JSON.stringify(parts.map((part) => [part.id, part.stats]));
  return <section className={styles.duel} aria-label={`${names[0]} / ${names[1]}`}>
    <div className={styles.duelSubjects}>
      {parts.map((part, side) => <div key={side} className={styles.duelSubject}>
        <span className={styles.sideLabel}>{side === 0 ? copy.left : copy.right}</span>
        <h2><Link href={`/parts/${slugs[side]}`}>{names[side]}</Link></h2>
        <p>{tp(`type_${part.type}`)} · {tp("release_date")}: {part.releaseAt ?? "—"}</p>
        <details className={styles.replacePart}>
          <summary>{copy.replace}</summary>
          <AddPartSearch slugs={slugs} allParts={allParts} locale={locale} replaceIndex={side} />
        </details>
        <Link className={styles.removePart} aria-label={`${t("remove")} ${names[side]}`}
          href={{ pathname: "/parts/compare", query: buildCompareQuery(slugs.filter((_, index) => index !== side)) }}>{t("remove")}</Link>
      </div>)}
    </div>
    <CompareArena key={arenaKey} left={parts[0]} right={parts[1]} locale={locale} />
    <dl className={styles.tugRows} aria-live="polite" aria-atomic="false">
      {COMPARE_STATS.map((field) => <TugRow key={field} field={field} label={tp(`stat_${field}`)}
        left={compareStat(parts[0], field)} right={compareStat(parts[1], field)} names={names} locale={locale} />)}
    </dl>
    <details className={styles.moreParts}><summary>{t("add_label")}</summary>
      <AddPartSearch slugs={slugs} allParts={allParts} locale={locale} />
    </details>
  </section>;
}
