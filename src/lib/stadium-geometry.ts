/**
 * Geometric constants for the competitive-stadium top-down signature
 * (ticket 07) — grounded in the real structure of an official Beyblade X
 * stadium, not invented decoration:
 *
 *   - A circular bowl inset within a squarer outer housing.
 *   - A raised "Tornado Ridge" partway between the bowl wall and center,
 *     which deflects Blades back inward instead of letting them exit.
 *   - A single exit notch on ONE side of the rim only (real stadiums are
 *     asymmetric, not a symmetric mandala): a wide center "Xtreme Zone"
 *     flanked by two narrower "Over Zone" pockets.
 *   - A shallow center "stamina pocket" where a Blade can settle to win by
 *     outlasting its opponent rather than knocking it out.
 *
 * All radii are ratios of housingRadius = 1, so any consumer can scale this
 * to its own pixel size. Angles are in degrees, 0° = due right, increasing
 * counter-clockwise (standard SVG/math convention); the exit notch is
 * centered on 90° (straight up).
 */
export const STADIUM_GEOMETRY = {
  housingRadius: 1,
  bowlRadius: 0.86,
  tornadoRidgeRadius: 0.58,
  staminaPocketRadius: 0.16,

  /** The Xtreme Zone (center, widest) exit half-angle, in degrees. */
  xtremeZoneHalfAngle: 15,
  /** Each Over Zone (flanking, narrower) exit half-angle, in degrees. */
  overZoneHalfAngle: 8,
  /** Angle of each Over Zone's center, offset from the exit's 90° axis. */
  overZoneCenterOffset: 35,

  /** Where players position launchers — evenly spread across the rim arc
   *  that isn't consumed by the exit notch. */
  launchPositionAngles: [180, 225, 270, 315] as const,
} as const;
