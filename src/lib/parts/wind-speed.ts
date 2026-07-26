/**
 * Arena wind speed, derived from a subject's real Attack value.
 *
 * The hero's wind is not a decorative loop — ADR-0006 rules out autoplay
 * decoration ("不使用自動播放的裝飾動畫"). It earns its motion by encoding
 * a real number: each side's arcs orbit at a rate read off that side's own
 * Attack, so the left/right difference a viewer sees is the data
 * difference, not an art choice.
 *
 * Range is clamped against what the real data actually produces: a single
 * Part's attack tops out at 75 (Dran Buster), while a full Combo sums
 * across Blade+Ratchet+Bit and reaches ~115 (ADR-0007's own worked
 * example: Dran Sword + 3-60 + Flat = 115). ATTACK_CEILING is set above
 * both so a real subject never pins the scale.
 */
const ATTACK_CEILING = 120;
const SLOWEST_SECONDS = 9;
const FASTEST_SECONDS = 2.4;

/**
 * Seconds per full revolution. Higher Attack → shorter duration → visibly
 * faster wind. Returns the slowest rate for 0/negative attack rather than
 * dividing by zero or spinning infinitely fast.
 */
export function windDurationSeconds(attack: number): number {
  const clamped = Math.max(0, Math.min(ATTACK_CEILING, attack));
  const ratio = clamped / ATTACK_CEILING;
  const seconds = SLOWEST_SECONDS - ratio * (SLOWEST_SECONDS - FASTEST_SECONDS);
  return Math.round(seconds * 100) / 100;
}
