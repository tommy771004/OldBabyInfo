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
  launchPositionAngles,
} = STADIUM_GEOMETRY;

const R_BOWL = bowlRadius * SCALE;
const R_RIDGE = tornadoRidgeRadius * SCALE;
const R_POCKET = staminaPocketRadius * SCALE;

type Range = [number, number];

const XTREME: Range = [90 - xtremeZoneHalfAngle, 90 + xtremeZoneHalfAngle];
const OVER_LEFT: Range = [
  90 - overZoneCenterOffset - overZoneHalfAngle,
  90 - overZoneCenterOffset + overZoneHalfAngle,
];
const OVER_RIGHT: Range = [
  90 + overZoneCenterOffset - overZoneHalfAngle,
  90 + overZoneCenterOffset + overZoneHalfAngle,
];
const EXIT_ZONES: Range[] = [OVER_LEFT, XTREME, OVER_RIGHT];

/**
 * The wall is a full circle minus the three exit gaps — never a closed ring.
 * The gap itself is the notch: with no outer housing in this composition,
 * drawing the exit channels would leave loose marks floating outside the wall.
 */
const WALL_SEGMENTS: Range[] = [
  [OVER_RIGHT[1], OVER_LEFT[0] + 360],
  [OVER_LEFT[1], XTREME[0]],
  [XTREME[1], OVER_RIGHT[0]],
];

/** Ridge-height ticks, kept off the notch side so they never crowd the exit. */
const RIDGE_TICK_ANGLES = [150, 180, 210, 240, 270, 300, 330];

/**
 * Two of the four launch positions, mirrored about the axis opposite the
 * exit — one per player, the way a match actually starts.
 */
const DUEL_LAUNCH_ANGLES = [launchPositionAngles[1], launchPositionAngles[3]] as const;

/** One tooth of the Xtreme Line every 7.5°, along the wall only. */
const XTREME_LINE_STEP = 7.5;

/**
 * Which part of the field a page's mark puts its weight on.
 *
 * - `field`: the stadium itself, nothing singled out. The default for any
 *   page that has no single structure honestly its own — a mark that
 *   invented a meaning for one would be decoration, not information.
 * - `ridge`: the Tornado Ridge, which turns a Blade back inward. Guides.
 * - `launch`: the four launch positions on the rim, where players stand
 *   before a match. Events.
 * - `exits`: the Xtreme Zone and the two Over Zones — a finish through them
 *   is what scores. Meta Standing, which counts results.
 * - `xtreme-line`: the geared rail along the wall that a Bit catches to
 *   dash; X-Dash is one of the numbers a Combo carries. Combo.
 * - `duel`: two launch positions facing each other, one per player.
 *   Compare, which lines two Parts up against each other.
 */
export type ArenaSubject = "field" | "ridge" | "launch" | "exits" | "xtreme-line" | "duel";

const QUIET = 0.45;

/*
 * Line weights are written in the units of the 1000-wide drawing and
 * converted to screen pixels at the scale Guides was tuned at (17.5rem =
 * 280px across, so one unit = 0.28px). Every stroke is non-scaling, so the
 * 8rem mark on a data page and the 4.5rem one on a phone draw the very same
 * line as the large one instead of fading to a hairline as they shrink.
 */
const PX_PER_UNIT = 0.28;
const NON_SCALING = "non-scaling-stroke";
const w = (units: number) => Math.round(units * PX_PER_UNIT * 100) / 100;

/**
 * The site's one masthead object, drawn from the real stadium constants
 * (`STADIUM_GEOMETRY`) — the homepage draws the whole arena as its hero;
 * every other page carries this smaller plan of the same field, with the
 * structure that page is about drawn heaviest (ADR-0006: one geometry,
 * one symbol set, across the whole site).
 *
 * Rotated so the exit notch faces up-left, back toward the title rather
 * than off the page. Real stadiums open on one side only, so the asymmetry
 * is the point — this must never read as a symmetric mandala.
 *
 * Strokes take `currentColor`, so it belongs to whichever end of the ramp
 * it sits on. No fill, no gradient, no glow, no animation — every line is
 * real field structure.
 */
export function ArenaMark({ subject = "field", className }: { subject?: ArenaSubject; className?: string }) {
  const wallWeight = subject === "field" || subject === "xtreme-line" ? 4.5 : 2.5;
  const wallOpacity = subject === "field" || subject === "xtreme-line" ? 1 : QUIET;
  const ridgeIsSubject = subject === "ridge";

  return (
    <svg viewBox="0 0 1000 1000" className={className} aria-hidden="true" focusable="false">
      <g
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        transform={`rotate(38 ${CENTER} ${CENTER})`}
      >
        <g opacity={wallOpacity}>
          {WALL_SEGMENTS.map(([start, end], i) => (
            <path key={`wall-${i}`} d={arcPath(CENTER, CENTER, R_BOWL, start, end)} strokeWidth={w(wallWeight)} vectorEffect={NON_SCALING} />
          ))}
        </g>

        <circle
          cx={CENTER}
          cy={CENTER}
          r={R_RIDGE}
          strokeWidth={w(ridgeIsSubject ? 4.5 : 2.5)}
          vectorEffect={NON_SCALING}
          opacity={ridgeIsSubject || subject === "field" ? 1 : QUIET}
        />

        {ridgeIsSubject ? (
          <g opacity={0.55}>
            {RIDGE_TICK_ANGLES.map((angle) => (
              <Radial key={`tick-${angle}`} angle={angle} from={R_RIDGE} to={R_RIDGE + SCALE * 0.05} width={w(2.5)} />
            ))}
          </g>
        ) : null}

        {/* Stamina pocket — the shallow floor where a Blade settles and
            outlasts. Concentric because the real bowl is; nothing radial is
            added to "connect" it, which only ever read as a crosshair. */}
        <circle cx={CENTER} cy={CENTER} r={R_POCKET} strokeWidth={w(3)} vectorEffect={NON_SCALING} opacity={0.7} />

        {subject === "launch" ? <LaunchPositions angles={launchPositionAngles} /> : null}
        {subject === "duel" ? <LaunchPositions angles={DUEL_LAUNCH_ANGLES} /> : null}
        {subject === "exits" ? <ExitChannels /> : null}
        {subject === "xtreme-line" ? <XtremeLine /> : null}
      </g>
    </svg>
  );
}

/** A tenth of a unit is a fraction of a pixel at any size this is drawn,
 *  and the full-precision floats were most of the markup — the Xtreme Line
 *  alone is ~40 lines, written once into the HTML and again into the RSC
 *  payload. */
const round = (value: number) => Math.round(value * 10) / 10;

function Radial({ angle, from, to, width }: { angle: number; from: number; to: number; width: number }) {
  const inner = polarPoint(CENTER, CENTER, from, angle);
  const outer = polarPoint(CENTER, CENTER, to, angle);
  return (
    <line
      x1={round(inner.x)}
      y1={round(inner.y)}
      x2={round(outer.x)}
      y2={round(outer.y)}
      strokeWidth={width}
      vectorEffect={NON_SCALING}
    />
  );
}

/** A bar across the wall where the launcher sits, and the spot inside the
 *  bowl the Bey lands on. */
function LaunchPositions({ angles }: { angles: readonly number[] }) {
  return (
    <g>
      {angles.map((angle) => {
        const landing = polarPoint(CENTER, CENTER, R_BOWL - SCALE * 0.14, angle);
        return (
          <g key={`launch-${angle}`}>
            <Radial angle={angle} from={R_BOWL - SCALE * 0.06} to={R_BOWL + SCALE * 0.06} width={w(4.5)} />
            <circle cx={round(landing.x)} cy={round(landing.y)} r={round(SCALE * 0.035)} strokeWidth={w(3)} vectorEffect={NON_SCALING} />
          </g>
        );
      })}
    </g>
  );
}

/** The channel walls either side of each exit gap, drawn outward from the
 *  rim — the Xtreme Zone between its own two, the Over Zones beside it. */
function ExitChannels() {
  return (
    <g>
      {EXIT_ZONES.flatMap(([start, end]) => [start, end]).map((angle) => (
        <Radial key={`exit-${angle}`} angle={angle} from={R_BOWL} to={R_BOWL + SCALE * 0.1} width={w(4.5)} />
      ))}
    </g>
  );
}

/** Teeth on the inside of the wall: the rail is part of the wall, so it
 *  stops where the wall stops, at every exit. */
function XtremeLine() {
  const teeth = WALL_SEGMENTS.flatMap(([start, end]) => {
    const angles: number[] = [];
    for (let angle = start + XTREME_LINE_STEP / 2; angle < end; angle += XTREME_LINE_STEP) angles.push(angle);
    return angles;
  });
  // One path of ~40 short segments rather than ~40 <line> elements: the
  // drawing is identical and the markup is a fraction of the size.
  const d = teeth.map((angle) => {
    const inner = polarPoint(CENTER, CENTER, R_BOWL - SCALE * 0.045, angle);
    const outer = polarPoint(CENTER, CENTER, R_BOWL, angle);
    return `M${round(inner.x)} ${round(inner.y)}L${round(outer.x)} ${round(outer.y)}`;
  }).join("");
  return <path d={d} opacity={0.75} strokeWidth={w(2.5)} vectorEffect={NON_SCALING} />;
}
