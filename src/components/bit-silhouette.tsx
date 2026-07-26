import { bladeSilhouettePath } from "@/lib/parts/blade-silhouette-path.ts";
import {
  bitSilhouetteShape,
  type BitPlaystyle,
} from "@/lib/parts/bit-silhouette-wing-count.ts";

const SIZE = 64;

/**
 * A Bit's top-down silhouette (ticket 15) — same 64×64 solid-fill
 * convention as BladeSilhouette, driven by the real playstyle
 * classification rather than wing count (see
 * bit-silhouette-wing-count.ts for why a Bit's real ground-contact photos
 * don't reduce to a reliable per-item shape the way a Blade's does). No
 * center cutout: unlike a Blade or Ratchet, a Bit has no hole through its
 * middle in any real photo, and the solid disc reads as a visibly
 * different silhouette family at a glance — Blade (hole), Ratchet (ring),
 * Bit (solid) — each shape following what's actually true of that part
 * type, not an arbitrary style variation.
 */
export function BitSilhouette({
  playstyle,
  label,
}: {
  playstyle: BitPlaystyle;
  label: string;
}) {
  const { wingCount, innerRatio } = bitSilhouetteShape(playstyle);
  const outerRadius = 24;
  const d = bladeSilhouettePath(wingCount, {
    cx: SIZE / 2,
    cy: SIZE / 2,
    outerRadius,
    innerRadius: outerRadius * innerRatio,
  });

  return (
    <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} role="img" aria-label={label}>
      <path d={d} fill="currentColor" />
    </svg>
  );
}
