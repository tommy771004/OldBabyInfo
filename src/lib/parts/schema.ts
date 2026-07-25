import { z } from "zod";

/**
 * Stat composition verified against official MasterData.json and beybrew's
 * comboUtils.js — see ADR-0007. Blade and Ratchet carry three dimensions;
 * X-Dash and Burst Resistance exist only on Bit.
 */
// Not integers: some parts carry half-point values (e.g. the "5-70" ratchet
// is defense 8.5 / stamina 9.5 in the official community data).
export const threeStatSchema = z.strictObject({
  attack: z.number().min(0),
  defense: z.number().min(0),
  stamina: z.number().min(0),
});

export const fiveStatSchema = z.strictObject({
  attack: z.number().min(0),
  defense: z.number().min(0),
  stamina: z.number().min(0),
  xDash: z.number().min(0),
  burstResistance: z.number().min(0),
});

export type ThreeStat = z.infer<typeof threeStatSchema>;
export type FiveStat = z.infer<typeof fiveStatSchema>;

/**
 * Stat Edition: an officially-documented stat difference between SKUs of the
 * same Part (structured source, deterministic — see CONTEXT.md, ADR-0007).
 * Distinct from Mold Batch, which is undocumented physical variance.
 */
function statEditionSchema<S extends z.ZodType>(statSchema: S) {
  return z.object({
    label: z.string().min(1),
    releaseAt: z.iso.date().nullable(),
    stats: statSchema,
  });
}

/**
 * Mold Batch: physical variance never captured in official data, known only
 * from batch codes and community play-testing (see CONTEXT.md). Populated by
 * ticket 35's LLM extraction, not this schema's producer.
 */
const moldBatchSchema = z.object({
  batchCode: z.string().min(1),
  note: z.string().min(1),
  sourceUrl: z.url(),
});

/**
 * Mode: some Blades and Bits physically transform between forms (e.g. an
 * X-DASH-triggered shape change) with a distinct stat block per form. `stats`
 * on the Part always mirrors the first/default mode so plain listing and
 * sorting never need to special-case multi-mode parts.
 */
function modeSchema<S extends z.ZodType>(statSchema: S) {
  return z.object({
    label: z.string().min(1),
    stats: statSchema,
  });
}

const basePartFields = {
  /** Stable internal id, sourced from the official group_id — never renamed. */
  id: z.string().min(1),
  nameEn: z.string().min(1),
  nameJa: z.string().min(1).optional(),
  nameZhTw: z.string().min(1).optional(),
  aliases: z.array(z.string().min(1)).default([]),
  moldBatches: z.array(moldBatchSchema).default([]),
  generation: z.literal("X"),
  /** Earliest official release date for this Part, null when it never
   *  matched an official record. Required (not defaulted) so the seed
   *  generator must always make an explicit call, never a silent omission. */
  releaseAt: z.iso.date().nullable(),
};

/**
 * The official four-way playstyle classification — present in the
 * community data for both Blade and Bit (not Ratchet). Ticket 13's
 * "attack/defense/stamina/balance" symbol set is this field visualized;
 * for a Bit specifically, the same four values describe how it contacts
 * the stadium floor (pointed/wide/round/mixed), not a separate taxonomy.
 */
export const playstyleSchema = z.enum(["attack", "defense", "stamina", "balance"]);

export const bladeSchema = z.object({
  ...basePartFields,
  type: z.literal("blade"),
  stats: threeStatSchema,
  /** Optional: a handful of parts never matched an official record. */
  playstyle: playstyleSchema.optional(),
  modes: z.array(modeSchema(threeStatSchema)).default([]),
  statEditions: z.array(statEditionSchema(threeStatSchema)).default([]),
});

export const ratchetSchema = z.object({
  ...basePartFields,
  type: z.literal("ratchet"),
  stats: threeStatSchema,
  /** Encoded in every real ratchet's own name (e.g. "3-60" -> 60) —
   *  required, not optional, unlike playstyle. */
  height: z.number().positive(),
  statEditions: z.array(statEditionSchema(threeStatSchema)).default([]),
});

export const bitSchema = z.object({
  ...basePartFields,
  type: z.literal("bit"),
  stats: fiveStatSchema,
  playstyle: playstyleSchema.optional(),
  modes: z.array(modeSchema(fiveStatSchema)).default([]),
  statEditions: z.array(statEditionSchema(fiveStatSchema)).default([]),
});

export const partSchema = z.discriminatedUnion("type", [
  bladeSchema,
  ratchetSchema,
  bitSchema,
]);

export type Part = z.infer<typeof partSchema>;

export const partsFileSchema = z.array(partSchema).check((ctx) => {
  const seen = new Set<string>();
  for (const part of ctx.value) {
    if (seen.has(part.id)) {
      ctx.issues.push({
        code: "custom",
        message: `Duplicate part id: ${part.id}`,
        input: ctx.value,
      });
      return;
    }
    seen.add(part.id);
  }
});
