"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation.ts";
import { localizedNameOf } from "@/lib/parts/localized-name.ts";
import { slugify } from "@/lib/parts/slug.ts";
import { searchParts } from "@/lib/parts/search-parts.ts";
import { buildComboQuery, type ComboSlugs } from "@/lib/parts/combo-query.ts";
import { computeComboStats } from "@/lib/parts/combo-stats.ts";
import type { Locale } from "@/i18n/routing.ts";
import type { Part } from "@/lib/parts/schema.ts";

type PartType = Part["type"];

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

  const candidates = useMemo(() => {
    if (query.trim().length === 0) return [];
    return searchParts(
      allParts.filter((p) => p.type === slotType),
      query,
    ).slice(0, 8);
  }, [allParts, query, slotType]);

  if (selected) {
    return (
      <div>
        <span>{label}</span>
        <p>{localizedNameOf(selected, locale)}</p>
        <Link
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
    <div>
      <label>
        <span>{label}</span>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("search_placeholder")}
        />
      </label>
      {query.trim().length > 0 ? (
        candidates.length === 0 ? (
          <p>{t("no_matches")}</p>
        ) : (
          <ul>
            {candidates.map((part) => (
              <li key={part.id}>
                <Link
                  href={{
                    pathname: "/combo",
                    query: buildComboQuery({ ...slots, [slotType]: slugify(part.nameEn) }),
                  }}
                >
                  {localizedNameOf(part, locale)}
                </Link>
              </li>
            ))}
          </ul>
        )
      ) : null}
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

  return (
    <div>
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

      {selectedCount > 0 ? (
        <section>
          <h2>{t("stats_heading")}</h2>
          {selectedCount < 3 ? <p>{t("incomplete_notice")}</p> : null}
          <dl>
            <dt>{tp("stat_attack")}</dt>
            <dd className="stat-value">{stats.attack}</dd>
            <dt>{tp("stat_defense")}</dt>
            <dd className="stat-value">{stats.defense}</dd>
            <dt>{tp("stat_stamina")}</dt>
            <dd className="stat-value">{stats.stamina}</dd>
            <dt>{tp("stat_xDash")}</dt>
            <dd className="stat-value">{bit ? stats.xDash : t("bit_only_note")}</dd>
            <dt>{tp("stat_burstResistance")}</dt>
            <dd className="stat-value">{bit ? stats.burstResistance : t("bit_only_note")}</dd>
          </dl>
          <p>{t("weight_note")}</p>
        </section>
      ) : null}
    </div>
  );
}
