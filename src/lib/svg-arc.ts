/**
 * Angle convention matches stadium-geometry.ts: 0° = due right, increasing
 * counter-clockwise, 90° = straight up. SVG's y-axis increases downward, so
 * "up" is expressed as negative y here.
 */
export function polarPoint(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = (angleDeg * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy - r * Math.sin(rad) };
}

/** SVG path `d` for an arc from startAngle to endAngle (degrees, CCW) at
 *  radius r around (cx, cy). Sweeps the short way unless the span is > 180°. */
export function arcPath(
  cx: number,
  cy: number,
  r: number,
  startAngleDeg: number,
  endAngleDeg: number,
) {
  const start = polarPoint(cx, cy, r, startAngleDeg);
  const end = polarPoint(cx, cy, r, endAngleDeg);
  const span = Math.abs(endAngleDeg - startAngleDeg);
  const largeArcFlag = span > 180 ? 1 : 0;
  // CCW in math-angle terms is clockwise on screen once y is flipped,
  // so sweep-flag 0 draws the short way round for our convention.
  const sweepFlag = 0;
  return `M${start.x.toFixed(2)},${start.y.toFixed(2)} A${r.toFixed(2)},${r.toFixed(2)} 0 ${largeArcFlag} ${sweepFlag} ${end.x.toFixed(2)},${end.y.toFixed(2)}`;
}
