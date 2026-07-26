import { polarPoint } from "@/lib/svg-arc.ts";

/**
 * Parametric top-down Blade silhouette (ticket 14) — the same drawing
 * convention as the stadium signature (ticket 07) and the type symbols
 * (ticket 13): plain geometry built from `polarPoint`, no decoration.
 *
 * A real Blade's wing count (see blade-wing-count.ts, read off real product
 * photos) drives an N-fold rotationally symmetric silhouette: N outer tips
 * at `outerRadius`, each swept into the next by a quadratic curve pulled
 * through an inner point at `innerRadius`. The inner point sits past the
 * midpoint between two tips (`sweep` > 0.5) rather than exactly between
 * them, so each wing trails like it's mid-rotation instead of reading as a
 * static flower — the same "heat comes from real rotation" idea ticket 40
 * uses, expressed here as a fixed silhouette rather than motion.
 */
export function bladeSilhouettePath(
  wingCount: number,
  {
    cx = 32,
    cy = 32,
    outerRadius = 27,
    innerRadius = outerRadius * 0.58,
    sweep = 0.62,
  }: {
    cx?: number;
    cy?: number;
    outerRadius?: number;
    innerRadius?: number;
    sweep?: number;
  } = {},
): string {
  const n = Math.max(2, Math.round(wingCount));
  const step = 360 / n;
  const commands: string[] = [];

  for (let i = 0; i <= n; i++) {
    const outer = polarPoint(cx, cy, outerRadius, step * i);
    if (i === 0) {
      commands.push(`M${outer.x.toFixed(2)},${outer.y.toFixed(2)}`);
      continue;
    }
    const inner = polarPoint(cx, cy, innerRadius, step * (i - 1) + step * sweep);
    commands.push(`Q${inner.x.toFixed(2)},${inner.y.toFixed(2)} ${outer.x.toFixed(2)},${outer.y.toFixed(2)}`);
  }
  commands.push("Z");
  return commands.join(" ");
}
