import styles from "./spin-wind.module.css";

/**
 * The airflow a spinning Beyblade drags around itself (homepage hero).
 *
 * Built from the same vocabulary as the stadium signature: bare dashed
 * strokes, no fill, no glow, no blur, no particles — ADR-0006 rules all
 * three of those out, and straight tangential speed-lines are already
 * spoken for by the arena's own trajectory lines, so these stay curved.
 *
 * The three rings rotate at *different* rates rather than locking
 * together: angular velocity falls off with radius in a real vortex, so
 * the outer rings trail the inner one. That shear is what stops it
 * reading as one rigid decal spinning in place.
 *
 * `durationSeconds` comes from the subject's real Attack value — see
 * wind-speed.ts. Decorative to a screen reader, so the whole SVG is
 * aria-hidden; it never carries information that isn't also in the stat
 * rows below it.
 */
const RINGS = [
  { radius: 33, dashes: 9, dashLength: 7, widthScale: 1, durationScale: 1 },
  { radius: 41, dashes: 9, dashLength: 12, widthScale: 0.8, durationScale: 1.35 },
  { radius: 49, dashes: 12, dashLength: 5, widthScale: 0.65, durationScale: 1.75 },
] as const;

/**
 * A dash pattern that doesn't divide evenly into its own circumference
 * leaves a seam where the run doesn't close — and rotating the ring drags
 * that seam around in a visible circuit. Deriving the gap from the real
 * circumference makes every ring close on itself exactly, so there is no
 * seam to see at any angle.
 */
function seamlessDashArray(radius: number, dashes: number, dashLength: number): string {
  const circumference = 2 * Math.PI * radius;
  const gap = circumference / dashes - dashLength;
  return `${dashLength} ${gap.toFixed(4)}`;
}

export function SpinWind({ durationSeconds }: { durationSeconds: number }) {
  return (
    <svg
      className={styles.wind}
      viewBox="0 0 100 100"
      aria-hidden="true"
      focusable="false"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
    >
      {RINGS.map((ring) => (
        <circle
          key={ring.radius}
          cx="50"
          cy="50"
          r={ring.radius}
          strokeWidth={1.1 * ring.widthScale}
          strokeDasharray={seamlessDashArray(ring.radius, ring.dashes, ring.dashLength)}
          className={styles.ring}
          style={{ animationDuration: `${durationSeconds * ring.durationScale}s` }}
        />
      ))}
    </svg>
  );
}
