import { useId } from "react";
import { bladeSilhouettePath } from "@/lib/parts/blade-silhouette-path.ts";
import { ratchetInnerRadius } from "@/lib/parts/ratchet-silhouette-path.ts";

const SIZE = 64;
const OUTER_RADIUS = 27;
/** Every Ratchet is a geared ring around a center shaft hole — a fixed
 *  tooth count reads correctly for the whole family; it's the ring's own
 *  wall thickness (see ratchetInnerRadius) that carries the real per-part
 *  fact (height), not the tooth count. */
const TEETH = 10;

/**
 * A Ratchet's top-down silhouette (ticket 15) — same drawing convention as
 * BladeSilhouette (solid fill, `<mask>`-cut hole, 64×64 canvas), but a
 * ring rather than a near-solid disc: every real Ratchet photo is a
 * geared ring around a center shaft hole, never a filled disc. Height, a
 * Z-axis fact no top-down outline can show directly, is carried by the
 * ring's own wall thickness instead — see ratchet-silhouette-path.ts.
 */
export function RatchetSilhouette({ height, label }: { height: number; label: string }) {
  const maskId = useId();
  const outer = bladeSilhouettePath(TEETH, {
    cx: SIZE / 2,
    cy: SIZE / 2,
    outerRadius: OUTER_RADIUS,
    innerRadius: OUTER_RADIUS * 0.88,
    sweep: 0.5,
  });
  const holeRadius = ratchetInnerRadius(height, OUTER_RADIUS);

  return (
    <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} role="img" aria-label={label}>
      <mask id={maskId}>
        <path d={outer} fill="white" />
        <circle cx={SIZE / 2} cy={SIZE / 2} r={holeRadius} fill="black" />
      </mask>
      <path d={outer} fill="currentColor" mask={`url(#${maskId})`} />
    </svg>
  );
}
