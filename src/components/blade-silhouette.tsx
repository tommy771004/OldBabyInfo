import { useId } from "react";
import { bladeSilhouettePath } from "@/lib/parts/blade-silhouette-path.ts";

const SIZE = 64;

/**
 * A Blade's top-down silhouette (ticket 14) — a solid filled shape (a true
 * "剪影"/silhouette, unlike the bare-line PlaystyleSymbol glyphs), so it
 * reads as the part's own visual weight rather than another line icon. The
 * small center cutout mirrors every real Blade's own visible driver
 * socket — and doubles as the stadium signature's stamina-pocket motif, so
 * this still belongs to the same one visual language (ADR-0006) even
 * filled. A `<mask>` punches the hole so it stays transparent (shows
 * whatever is actually behind it) rather than baking in one background
 * color that would only be right in one of the two lightings.
 */
export function BladeSilhouette({ wingCount, label }: { wingCount: number; label: string }) {
  const maskId = useId();
  const outer = bladeSilhouettePath(wingCount, { cx: SIZE / 2, cy: SIZE / 2, outerRadius: 27 });

  return (
    <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} role="img" aria-label={label}>
      <mask id={maskId}>
        <path d={outer} fill="white" />
        <circle cx={SIZE / 2} cy={SIZE / 2} r={6} fill="black" />
      </mask>
      <path d={outer} fill="currentColor" mask={`url(#${maskId})`} />
    </svg>
  );
}

/**
 * Same canvas, same footprint as BladeSilhouette — for a Blade whose real
 * wing count hasn't been observed off a photo yet (ticket 14's "no broken
 * image" requirement). A dashed ring, not a blank cell or a missing-image
 * icon: it reads as "not drawn yet," and reuses the stadium signature's
 * own Tornado Ridge dash pattern rather than inventing a new placeholder
 * language.
 */
export function BladeSilhouettePlaceholder({ label }: { label: string }) {
  return (
    <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} role="img" aria-label={label}>
      <circle
        cx={SIZE / 2}
        cy={SIZE / 2}
        r={20}
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeOpacity={0.35}
        strokeDasharray="5 5"
      />
    </svg>
  );
}
