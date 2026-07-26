import type { Part } from "./schema.ts";

export interface ComboStats {
  attack: number;
  defense: number;
  stamina: number;
  xDash: number;
  burstResistance: number;
}

/**
 * ADR-0007's rule, applied exactly: Attack/Defense/Stamina sum across
 * whichever of Blade/Ratchet/Bit are actually selected (a missing piece
 * contributes 0, not an error); X-Dash/Burst Resistance read only from the
 * Bit, never summed with anything else, because Blade/Ratchet don't carry
 * those dimensions in the official data at all.
 */
export function computeComboStats(
  blade: Part | undefined,
  ratchet: Part | undefined,
  bit: Part | undefined,
): ComboStats {
  const parts = [blade, ratchet, bit].filter((p): p is Part => p !== undefined);
  return {
    attack: parts.reduce((sum, p) => sum + p.stats.attack, 0),
    defense: parts.reduce((sum, p) => sum + p.stats.defense, 0),
    stamina: parts.reduce((sum, p) => sum + p.stats.stamina, 0),
    xDash: bit?.type === "bit" ? bit.stats.xDash : 0,
    burstResistance: bit?.type === "bit" ? bit.stats.burstResistance : 0,
  };
}
