/**
 * A Ratchet's real fixed height (see schema.ts, parsed straight off its own
 * name — e.g. "3-70" → 70) is a Z-axis fact: no top-down outline can show
 * it directly, unlike a Blade's wing count. The honest option isn't to
 * fake a height-dependent outline shape (real reference photos across
 * different heights of the same tooth family look identical from directly
 * above — height only shows up as physical thickness from the side); it's
 * a documented convention layered onto the same top-down silhouette
 * language: the ring's own wall thickness stands in for height. Taller
 * ratchet, thicker wall.
 */
const HEIGHT_MIN = 50;
const HEIGHT_MAX = 85;
const WALL_MIN = 4;
const WALL_MAX = 15;

export function ratchetInnerRadius(height: number, outerRadius: number): number {
  const clamped = Math.max(HEIGHT_MIN, Math.min(HEIGHT_MAX, height));
  const fillRatio = (clamped - HEIGHT_MIN) / (HEIGHT_MAX - HEIGHT_MIN);
  const wallThickness = WALL_MIN + fillRatio * (WALL_MAX - WALL_MIN);
  return outerRadius - wallThickness;
}
