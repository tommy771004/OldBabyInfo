import { STADIUM_GEOMETRY } from "@/lib/stadium-geometry.ts";
import { arcPath, polarPoint } from "@/lib/svg-arc.ts";

const SCALE = 440;
const CENTER = 500;

const {
  bowlRadius,
  tornadoRidgeRadius,
  staminaPocketRadius,
  xtremeZoneHalfAngle,
  overZoneHalfAngle,
  overZoneCenterOffset,
  launchPositionAngles,
} = STADIUM_GEOMETRY;

const R_BOWL = bowlRadius * SCALE;
const R_RIDGE = tornadoRidgeRadius * SCALE;
const R_POCKET = staminaPocketRadius * SCALE;

// The exit notch's three openings, each [start, end] in degrees.
const XTREME_ZONE: [number, number] = [90 - xtremeZoneHalfAngle, 90 + xtremeZoneHalfAngle];
const OVER_ZONE_LEFT: [number, number] = [
  90 - overZoneCenterOffset - overZoneHalfAngle,
  90 - overZoneCenterOffset + overZoneHalfAngle,
];
const OVER_ZONE_RIGHT: [number, number] = [
  90 + overZoneCenterOffset - overZoneHalfAngle,
  90 + overZoneCenterOffset + overZoneHalfAngle,
];

// The bowl wall is a full circle minus those three gaps — drawn as the
// three remaining solid segments, going the long way round.
const WALL_SEGMENTS: [number, number][] = [
  [OVER_ZONE_RIGHT[1], OVER_ZONE_LEFT[0] + 360], // the long back wall
  [OVER_ZONE_LEFT[1], XTREME_ZONE[0]], // between left Over Zone and Xtreme Zone
  [XTREME_ZONE[1], OVER_ZONE_RIGHT[0]], // between Xtreme Zone and right Over Zone
];

/**
 * The site's signature artifact (ticket 07, ADR-0006) — a top-down
 * competitive stadium, grounded in the real structure of an official
 * Beyblade X stadium: a circular bowl inset in a squarer housing, a raised
 * Tornado Ridge, and a single asymmetric exit notch (a wide center Xtreme
 * Zone flanked by two narrower Over Zones) — real stadiums only exit on
 * one side, never a symmetric ring of gaps. No gradients, glow, or
 * particles; every line is real field information, not decoration.
 */
export function StadiumSignature({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 1000 1000"
      className={className}
      role="img"
      aria-label="戰鬥陀螺競技場俯視圖"
    >
      <g fill="none" stroke="var(--ink-on-dark)" strokeLinecap="round">
        {/* Outer housing — a squarer shell around the circular bowl. */}
        <rect
          x={CENTER - SCALE}
          y={CENTER - SCALE}
          width={SCALE * 2}
          height={SCALE * 2}
          rx={SCALE * 0.14}
          strokeWidth={6}
        />

        {/* Exit chutes: short channels through the housing at each notch. */}
        {[XTREME_ZONE, OVER_ZONE_LEFT, OVER_ZONE_RIGHT].map(([start, end], i) => {
          const mid = (start + end) / 2;
          const a = polarPoint(CENTER, CENTER, R_BOWL, start);
          const b = polarPoint(CENTER, CENTER, R_BOWL, end);
          const aOut = polarPoint(CENTER, CENTER, SCALE, start);
          const bOut = polarPoint(CENTER, CENTER, SCALE, end);
          return (
            <g key={`chute-${i}`}>
              <line x1={a.x} y1={a.y} x2={aOut.x} y2={aOut.y} strokeWidth={4} />
              <line x1={b.x} y1={b.y} x2={bOut.x} y2={bOut.y} strokeWidth={4} />
              {/* One radial tick marking the exit's center line. */}
              <line
                x1={polarPoint(CENTER, CENTER, R_BOWL * 0.97, mid).x}
                y1={polarPoint(CENTER, CENTER, R_BOWL * 0.97, mid).y}
                x2={polarPoint(CENTER, CENTER, SCALE * 0.94, mid).x}
                y2={polarPoint(CENTER, CENTER, SCALE * 0.94, mid).y}
                strokeWidth={2}
                opacity={0.5}
              />
            </g>
          );
        })}

        {/* Bowl wall — solid where there's no exit, gapped at the three notches. */}
        {WALL_SEGMENTS.map(([start, end], i) => (
          <path key={`wall-${i}`} d={arcPath(CENTER, CENTER, R_BOWL, start, end)} strokeWidth={5} />
        ))}

        {/* Tornado Ridge — a raised ring inside the bowl; dashed to read as
            a ridge (a 3D rise) rather than another flat wall. */}
        <circle cx={CENTER} cy={CENTER} r={R_RIDGE} strokeWidth={3} strokeDasharray="14 10" />

        {/* Stamina pocket — the shallow center depression. */}
        <circle cx={CENTER} cy={CENTER} r={R_POCKET} strokeWidth={3} />
        <circle cx={CENTER} cy={CENTER} r={4} fill="var(--ink-on-dark)" stroke="none" />

        {/* Launch positions — tick marks at the rim, clear of the exit. */}
        {launchPositionAngles.map((angle) => {
          const inner = polarPoint(CENTER, CENTER, R_BOWL - 18, angle);
          const outer = polarPoint(CENTER, CENTER, R_BOWL + 18, angle);
          return (
            <line
              key={`launch-${angle}`}
              x1={inner.x}
              y1={inner.y}
              x2={outer.x}
              y2={outer.y}
              strokeWidth={5}
              stroke="var(--accent-on-dark)"
            />
          );
        })}
      </g>
    </svg>
  );
}
