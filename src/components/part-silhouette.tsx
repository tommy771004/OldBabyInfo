"use client";

import { useTranslations } from "next-intl";
import { BladeSilhouette, BladeSilhouettePlaceholder } from "@/components/blade-silhouette.tsx";
import { RatchetSilhouette } from "@/components/ratchet-silhouette.tsx";
import { BitSilhouette } from "@/components/bit-silhouette.tsx";
import { wingCountFor, hasObservedWingCount } from "@/lib/parts/blade-wing-count.ts";
import type { Part } from "@/lib/parts/schema.ts";

/**
 * The right top-down silhouette for whichever kind of Part this is.
 *
 * Extracted from the compare table so the Combo builder shows a part the same
 * way the comparison does — ADR-0006 allows one geometry and symbol set across
 * the site, and two hand-copied versions of this switch would be the first
 * step away from that.
 *
 * A Blade whose wing count has not actually been observed gets the
 * placeholder, not a guessed shape: the silhouette is a claim about the real
 * part, so an unmeasured one says so.
 *
 * `showPlaceholder` turns that off for the compact pickers. Wing-count
 * observation lags new releases — the six most recently released Blades
 * currently have none — so a "newest first" list would otherwise be a column
 * of identical empty rings. In a table the placeholder states something
 * useful; in a one-line picker row it is noise, so there the mark is simply
 * absent and the space stays reserved for alignment.
 */
export function PartSilhouette({
  part,
  showPlaceholder = true,
}: {
  part: Part;
  showPlaceholder?: boolean;
}) {
  const tp = useTranslations("PartsPage");

  if (part.type === "blade") {
    if (hasObservedWingCount(part.id)) {
      return (
        <BladeSilhouette
          wingCount={wingCountFor(part.id)}
          label={tp("silhouette_label", { count: wingCountFor(part.id) })}
        />
      );
    }
    return showPlaceholder ? <BladeSilhouettePlaceholder label={tp("silhouette_unknown_label")} /> : null;
  }

  if (part.type === "ratchet") {
    return (
      <RatchetSilhouette
        height={part.height}
        label={tp("silhouette_ratchet_label", { height: part.height })}
      />
    );
  }

  if (part.playstyle) {
    return <BitSilhouette playstyle={part.playstyle} label={tp(`silhouette_bit_${part.playstyle}`)} />;
  }
  return showPlaceholder ? <BladeSilhouettePlaceholder label={tp("silhouette_unknown_label")} /> : null;
}
