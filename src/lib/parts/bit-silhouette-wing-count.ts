/**
 * A Bit's real ground-contact photos don't reduce to a simple "pointed =
 * attack" rule — checked a spread of real reference photos across all four
 * playstyles and both Needle and Spike (sharp-tipped) are official
 * DEFENSE bits, not attack, while some attack bits (Flat, Gear Rush) are
 * comparatively blunt. The honest per-item shape isn't reliably
 * extractable from a product photo the way a Blade's wing count is. What
 * IS real is the playstyle classification itself (schema.ts's
 * playstyleSchema — the same official four-way split ticket 13 already
 * used for the bare-line glyphs). This maps that real classification onto
 * the same parametric generator ticket 14 built for Blades
 * (blade-silhouette-path.ts), so a Bit's silhouette stays in the same
 * visual family while still being driven by a real fact, not a per-item
 * guess at its physical tip shape.
 *
 * `innerRatio` is set per playstyle rather than left at
 * bladeSilhouettePath's default (0.58 of the outer radius) because a high
 * wing count needs a much shallower scallop to actually read as "round"
 * instead of a spiky gear — checked at real render size, not assumed.
 * Stamina's near-circle also happens to genuinely match its real photos
 * (a smooth ball tip).
 */
export const BIT_SILHOUETTE_SHAPE = {
  attack: { wingCount: 3, innerRatio: 0.5 },
  defense: { wingCount: 6, innerRatio: 0.65 },
  balance: { wingCount: 4, innerRatio: 0.58 },
  stamina: { wingCount: 20, innerRatio: 0.9 },
} as const;

export type BitPlaystyle = keyof typeof BIT_SILHOUETTE_SHAPE;

export function bitSilhouetteShape(playstyle: BitPlaystyle): { wingCount: number; innerRatio: number } {
  return BIT_SILHOUETTE_SHAPE[playstyle];
}
