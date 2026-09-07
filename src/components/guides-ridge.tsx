import { STADIUM_GEOMETRY } from "@/lib/stadium-geometry.ts";
import { arcPath, polarPoint } from "@/lib/svg-arc.ts";

const SCALE = 460;
const CENTER = 500;

const {
  bowlRadius,
  tornadoRidgeRadius,
  staminaPocketRadius,
  xtremeZoneHalfAngle,
  overZoneHalfAngle,
  overZoneCenterOffset,
} = STADIUM_GEOMETRY;

const R_BOWL = bowlRadius * SCALE;
const R_RIDGE = tornadoRidgeRadius * SCALE;
const R_POCKET = staminaPocketRadius * SCALE;

const XTREME: [number, number] = [90 - xtremeZoneHalfAngle, 90 + xtremeZoneHalfAngle];
const OVER_LEFT: [number, number] = [
  90 - overZoneCenterOffset - overZoneHalfAngle,
  90 - overZoneCenterOffset + overZoneHalfAngle,
];
const OVER_RIGHT: [number, number] = [
  90 + overZoneCenterOffset - overZoneHalfAngle,
  90 + overZoneCenterOffset + overZoneHalfAngle,
];

/**
 * The wall is a full circle minus the three exit gaps — never a closed ring.
 * The gap itself is the notch: with no outer housing in this composition,
 * drawing the exit channels would leave loose marks floating outside the wall.
 */
const WALL_SEGMENTS: [number, number][] = [
  [OVER_RIGHT[1], OVER_LEFT[0] + 360],
  [OVER_LEFT[1], XTREME[0]],
  [XTREME[1], OVER_RIGHT[0]],
];

/** Ridge-height ticks, kept off the notch side so they never crowd the exit. */
const RIDGE_TICK_ANGLES = [150, 180, 210, 240, 270, 300, 330];

/**
 * The guides section's own object, built from the same real constants as the
 * homepage's StadiumSignature but drawing a different subject. The homepage
 * shows the whole arena as the site's hero; this draws the Tornado Ridge —
 * the raised ring that deflects a Blade back inward instead of letting it
 * leave. On the page a newcomer lands on, that is the honest image: the
 * structure that keeps you in.
 *
 * Rotated so the single exit notch faces up-left, back toward the title,
 * rather than off the page. Real stadiums open on one side only, so the
 * asymmetry is the point — this must never read as a symmetric mandala.
 *
 * Drawn complete and never cropped: it is placed fully inside its column so
 * no container edge can shave a line off it. Strokes take `currentColor`, so
 * it belongs to whichever end of the ramp it sits on. No fill, no gradient,
 * no glow — every line is real field structure.
 */
export function GuidesRidge({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 1000 1000" className={className} aria-hidden="true" focusable="false">
      <g
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        transform={`rotate(38 ${CENTER} ${CENTER})`}
      >
        {/* Bowl wall — quieter than the ridge, which is the subject. */}
        <g opacity={0.45}>
          {WALL_SEGMENTS.map(([start, end], i) => (
            <path key={`wall-${i}`} d={arcPath(CENTER, CENTER, R_BOWL, start, end)} strokeWidth={2.5} />
          ))}
        </g>

        {/* The Tornado Ridge — the subject, drawn heaviest. */}
        <circle cx={CENTER} cy={CENTER} r={R_RIDGE} strokeWidth={4.5} />

        {/* Ticks reading the ridge's raised height. */}
        <g opacity={0.55}>
          {RIDGE_TICK_ANGLES.map((angle) => {
            const inner = polarPoint(CENTER, CENTER, R_RIDGE, angle);
            const outer = polarPoint(CENTER, CENTER, R_RIDGE + SCALE * 0.05, angle);
            return (
              <line
                key={`tick-${angle}`}
                x1={inner.x}
                y1={inner.y}
                x2={outer.x}
                y2={outer.y}
                strokeWidth={2.5}
              />
            );
          })}
        </g>

        {/* Stamina pocket — the shallow floor where a Blade settles and
            outlasts. Concentric because the real bowl is; nothing radial is
            added to "connect" it, which only ever read as a crosshair. */}
        <circle cx={CENTER} cy={CENTER} r={R_POCKET} strokeWidth={3} opacity={0.7} />
      </g>
    </svg>
  );
}
