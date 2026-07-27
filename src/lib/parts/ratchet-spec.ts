import type { Part } from "./schema.ts";

/**
 * A Ratchet's own official name encodes both of its physical specs: "3-60"
 * is 3 teeth at 60 dmm, "M-85" is the metal Ratchet at 85 (see CONTEXT.md —
 * a Ratchet "決定高度與齒數"). The height is already a schema field because
 * every consumer needs it; the tooth count is read back off the name here
 * instead of being stored again, so there is exactly one place it can be
 * wrong and no seed migration can put the two out of step.
 */
export type RatchetTeeth = number | "metal";

const NAME = /^(\d|M)-(\d{2})$/i;

export function ratchetTeethOf(part: Part): RatchetTeeth | undefined {
  if (part.type !== "ratchet") return undefined;

  const match = NAME.exec(part.nameEn.trim());
  if (!match) return undefined;
  const teeth = match[1]!;
  return teeth.toUpperCase() === "M" ? "metal" : Number(teeth);
}

export function ratchetTeethParam(teeth: RatchetTeeth): string {
  return teeth === "metal" ? "metal" : String(teeth);
}

/** Parses back the `?teeth=` param; anything else reads as "no filter". */
export function parseRatchetTeeth(value: string | undefined): RatchetTeeth | undefined {
  if (!value) return undefined;
  if (value === "metal") return "metal";
  return /^\d$/.test(value) ? Number(value) : undefined;
}
