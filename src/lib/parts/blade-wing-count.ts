/**
 * Real wing counts (ticket 14), read by hand off each Blade's own official
 * product photo (fetched from beybrew's image CDN, the same source
 * generate-parts-seed.ts pulls stats from) — not invented. 71 of the 84
 * current Blades have a cataloged photo; those 71 counts below are direct
 * observations. The remaining 13 are newer releases with no photo yet in
 * that source as of this snapshot — they fall back to DEFAULT_WING_COUNT,
 * which is the real mode of the 71 observed values (4, at 37/71), not an
 * arbitrary guess.
 *
 * "Wing count" here means the number of major swept points on the blade's
 * silhouette as seen from directly above — most Blades are clearly 2, 3, or
 * 4-fold rotationally symmetric; a handful of circular/gear-rimmed designs
 * (e.g. Rock Leone, Fortress) were read as a higher count (6-8) since a
 * shallow, many-scalloped silhouette is what actually reads back as
 * "round" at small sizes, rather than inventing a separate shape family
 * for them.
 */
export const DEFAULT_WING_COUNT = 4;

export const BLADE_WING_COUNTS: Record<string, number> = {
  AEROPEGASUS: 4,
  ARC: 4,
  BLACKSHELL: 4,
  BLAST: 3,
  BLITZ: 4,
  BRAVE: 3,
  BRUSH: 4,
  CLOCKMIRAGE: 6,
  COBALTDRAGOON: 4,
  COBALTDRAKE: 3,
  CRIMSONGARUDA: 4,
  DARK: 3,
  DELTA: 6,
  DRACIELSHIELD: 4,
  DRAGOONSTORM: 4,
  DRANBUSTER: 3,
  DRANDAGGER: 3,
  DRANSWORD: 3,
  DRANZERSPIRAL: 4,
  DRIGERSLASH: 4,
  ECLIPSE: 4,
  FANG: 4,
  FLAME: 3,
  FLARE: 6,
  FORTRESS: 6,
  GHOSTCIRCLE: 2,
  GOLEMROCK: 4,
  HELLSCHAIN: 3,
  HELLSHAMMER: 3,
  HELLSSCYTHE: 3,
  HUNT: 5,
  IMPACTDRAKE: 3,
  KNIGHTLANCE: 4,
  KNIGHTMAIL: 4,
  KNIGHTSHIELD: 4,
  LEONCLAW: 4,
  LEONCREST: 4,
  "LIGHTNING L-DRAGO": 6,
  METEORDRAGOON: 3,
  MIGHT: 8,
  MUMMYCURSE: 4,
  OROCHICLUSTER: 2,
  PHOENIXFEATHER: 4,
  PHOENIXRUDDER: 3,
  PHOENIXWING: 3,
  RAGE: 8,
  REAPER: 4,
  RHINOHORN: 4,
  ROCKLEONE: 6,
  SAMURAICALIBUR: 3,
  SAMURAISABER: 2,
  SCORPIOSPEAR: 3,
  SHARKEDGE: 4,
  SHARKSCALE: 3,
  SHELTERDRAKE: 4,
  SHINOBIKNIFE: 4,
  SHINOBISHADOW: 4,
  SILVERWOLF: 4,
  SPHINXCOWL: 4,
  STORMSPRIGGAN: 3,
  TRICERAPRESS: 4,
  TYRANNOBEAT: 3,
  UNICORNSTING: 4,
  VIPERTAIL: 4,
  VOLT: 4,
  WEISSTIGER: 4,
  WHALEWAVE: 4,
  WIZARDARROW: 3,
  WIZARDROD: 4,
  WYVERNGALE: 3,
  XENOXCALIBUR: 4,
};

export function wingCountFor(bladeId: string): number {
  return BLADE_WING_COUNTS[bladeId] ?? DEFAULT_WING_COUNT;
}

/** True only for the 71 Blades read directly off a real product photo —
 *  distinguishes an observed count from the documented default fallback. */
export function hasObservedWingCount(bladeId: string): boolean {
  return bladeId in BLADE_WING_COUNTS;
}
