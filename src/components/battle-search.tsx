"use client";

import Image from "next/image";
import { useId, useMemo, useState } from "react";
import type { Locale } from "@/i18n/routing.ts";
import type { Part } from "@/lib/parts/schema.ts";
import {
  imagePartOf,
  makePartSubject,
  searchBattleSubjects,
  subjectNameOf,
  subjectStatsOf,
  type BattleSubject,
} from "@/lib/parts/battle-subjects.ts";
import { StadiumSignature } from "./stadium-signature.tsx";
import { SpinWind } from "./spin-wind.tsx";
import { windDurationSeconds } from "@/lib/parts/wind-speed.ts";
import styles from "./battle-search.module.css";

type PartImage = { url: string; width: number; height: number };

export interface BattleSearchLabels {
  searchLabel: string;
  searchPlaceholder: string;
  leftLabel: string;
  rightLabel: string;
  empty: string;
  analysisLabel: string;
  versus: string;
  statAttack: string;
  statDefense: string;
  statStamina: string;
}

function SearchLane({
  label,
  query,
  selected,
  allSubjects,
  locale,
  placeholder,
  empty,
  onQueryChange,
  onSelect,
}: {
  label: string;
  query: string;
  selected: BattleSubject | undefined;
  allSubjects: BattleSubject[];
  locale: Locale;
  placeholder: string;
  empty: string;
  onQueryChange: (query: string) => void;
  onSelect: (subject: BattleSubject) => void;
}) {
  const resultsId = useId();
  const [activeIndex, setActiveIndex] = useState(-1);
  const matches = useMemo(
    () => (query.trim() ? searchBattleSubjects(allSubjects, query).slice(0, 6) : []),
    [allSubjects, query],
  );

  function selectSubject(subject: BattleSubject) {
    setActiveIndex(-1);
    onSelect(subject);
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") {
      event.preventDefault();
      setActiveIndex(-1);
      onQueryChange("");
      return;
    }

    if (!query.trim() || matches.length === 0) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((current) => Math.min(current + 1, matches.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((current) => Math.max(current - 1, -1));
    } else if (event.key === "Enter" && activeIndex >= 0) {
      event.preventDefault();
      const subject = matches[activeIndex];
      if (subject) selectSubject(subject);
    }
  }

  return (
    <div className={styles.searchLane}>
      <label className={styles.searchLabel}>
        <span>{label}</span>
        <input
          aria-label={label}
          type="search"
          role="combobox"
          value={query}
          onChange={(event) => {
            setActiveIndex(-1);
            onQueryChange(event.target.value);
          }}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          autoComplete="off"
          aria-autocomplete="list"
          aria-controls={resultsId}
          aria-expanded={Boolean(query.trim())}
          aria-haspopup="listbox"
          aria-activedescendant={activeIndex >= 0 ? `${resultsId}-option-${activeIndex}` : undefined}
        />
      </label>

      {selected ? (
        <p className={styles.selectedSubject}>
          <span className={styles.selectedCode}>{subjectNameOf(selected, locale)}</span>
          {subjectNameOf(selected, locale) !== selected.nameEn ? <span>{selected.nameEn}</span> : null}
        </p>
      ) : null}

      {query.trim() ? (
        <div id={resultsId} className={styles.results} role="listbox" aria-label={`${label} results`}>
          {matches.length > 0 ? (
            matches.map((subject, index) => {
              const localizedName = subjectNameOf(subject, locale);
              return (
                <button
                  key={subject.id}
                  id={`${resultsId}-option-${index}`}
                  type="button"
                  role="option"
                  aria-selected={activeIndex === index}
                  data-active={activeIndex === index ? "true" : undefined}
                  className={styles.result}
                  onClick={() => selectSubject(subject)}
                >
                  <span>{subject.nameEn}</span>
                  {localizedName !== subject.nameEn ? <span>{localizedName}</span> : null}
                </button>
              );
            })
          ) : (
            <p className={styles.emptyResult}>{empty}</p>
          )}
        </div>
      ) : null}
    </div>
  );
}

function StatRows({ left, right, labels }: { left: BattleSubject; right: BattleSubject; labels: BattleSearchLabels }) {
  const leftStats = subjectStatsOf(left);
  const rightStats = subjectStatsOf(right);
  const rows = [
    [labels.statAttack, leftStats.attack, rightStats.attack],
    [labels.statDefense, leftStats.defense, rightStats.defense],
    [labels.statStamina, leftStats.stamina, rightStats.stamina],
  ] as const;

  return (
    <dl className={styles.statRows}>
      {rows.map(([label, leftValue, rightValue]) => (
        <div className={styles.statRow} key={label}>
          <dd className={styles.leftValue}>{leftValue}</dd>
          <dt>{label}</dt>
          <dd className={styles.rightValue}>{rightValue}</dd>
        </div>
      ))}
    </dl>
  );
}

function PartImage({ subject, image }: { subject: BattleSubject; image: PartImage | undefined }) {
  const part = imagePartOf(subject);
  if (!image) return <span className={styles.imageFallback}>{part.nameEn}</span>;

  return (
    <Image
      src={image.url}
      alt={part.nameEn}
      width={image.width}
      height={image.height}
      className={styles.partImage}
      sizes="(max-width: 720px) 30vw, 18vw"
    />
  );
}

function BattleArena({
  left,
  right,
  locale,
  images,
  labels,
}: {
  left: BattleSubject;
  right: BattleSubject;
  locale: Locale;
  images: Record<string, PartImage>;
  labels: BattleSearchLabels;
}) {
  const collisionStrength = Math.round((subjectStatsOf(left).attack + subjectStatsOf(right).attack) / 2);

  return (
    <section className={styles.analysis} aria-labelledby="battle-analysis-heading">
      <div className={styles.arena} data-collision-strength={collisionStrength}>
        <div className={styles.arenaGeometry} aria-hidden="true">
          <StadiumSignature />
        </div>
        <div className={`${styles.competitor} ${styles.competitorLeft}`}>
          <span className={styles.competitorFigure}>
            <SpinWind durationSeconds={windDurationSeconds(subjectStatsOf(left).attack)} />
            <PartImage subject={left} image={images[imagePartOf(left).id]} />
          </span>
          <span>{subjectNameOf(left, locale)}</span>
        </div>
        <div className={`${styles.competitor} ${styles.competitorRight}`}>
          <span className={styles.competitorFigure}>
            <SpinWind durationSeconds={windDurationSeconds(subjectStatsOf(right).attack)} />
            <PartImage subject={right} image={images[imagePartOf(right).id]} />
          </span>
          <span>{subjectNameOf(right, locale)}</span>
        </div>
        <span className={styles.trajectoryLeft} aria-hidden="true" />
        <span className={styles.trajectoryRight} aria-hidden="true" />
        <span className={styles.collision} aria-hidden="true" />
      </div>

      <div className={styles.analysisCopy}>
        <p className={styles.analysisEyebrow}>{labels.analysisLabel}</p>
        <h2 id="battle-analysis-heading">
          {subjectNameOf(left, locale)} <span>{labels.versus}</span> {subjectNameOf(right, locale)}
        </h2>
        <StatRows left={left} right={right} labels={labels} />
      </div>
    </section>
  );
}

export function BattleSearch({
  allParts,
  combos = [],
  initialLeft,
  initialRight,
  locale,
  images = {},
  labels,
}: {
  allParts: Part[];
  combos?: BattleSubject[];
  initialLeft: BattleSubject | Part | undefined;
  initialRight: BattleSubject | Part | undefined;
  locale: Locale;
  images?: Record<string, PartImage>;
  labels: BattleSearchLabels;
}) {
  const allSubjects = useMemo(
    () => [...allParts.map(makePartSubject), ...combos],
    [allParts, combos],
  );
  const toSubject = (value: BattleSubject | Part | undefined): BattleSubject | undefined =>
    value && "kind" in value ? value : value ? makePartSubject(value) : undefined;
  const [left, setLeft] = useState(() => toSubject(initialLeft));
  const [right, setRight] = useState(() => toSubject(initialRight));
  const [leftQuery, setLeftQuery] = useState("");
  const [rightQuery, setRightQuery] = useState("");

  return (
    <section className={styles.battleSection} aria-label={labels.searchLabel}>
      <div className={styles.searchHeader}>
        <h1>{labels.searchLabel}</h1>
        <div className={styles.searchLanes}>
          <SearchLane
            label={labels.leftLabel}
            query={leftQuery}
            selected={left}
            allSubjects={allSubjects}
            locale={locale}
            placeholder={labels.searchPlaceholder}
            empty={labels.empty}
            onQueryChange={setLeftQuery}
            onSelect={(subject) => {
              setLeft(subject);
              setLeftQuery("");
            }}
          />
          <SearchLane
            label={labels.rightLabel}
            query={rightQuery}
            selected={right}
            allSubjects={allSubjects}
            locale={locale}
            placeholder={labels.searchPlaceholder}
            empty={labels.empty}
            onQueryChange={setRightQuery}
            onSelect={(subject) => {
              setRight(subject);
              setRightQuery("");
            }}
          />
        </div>
      </div>

      {left && right ? (
        <BattleArena left={left} right={right} locale={locale} images={images} labels={labels} />
      ) : (
        <p className={styles.missingSubject}>{labels.empty}</p>
      )}
    </section>
  );
}
