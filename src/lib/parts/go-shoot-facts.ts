import type { Part } from "./schema.ts";

/**
 * One entry in a Go-Shoot Part database file
 * (`go-shoot.github.io/x/db/part-{blade,ratchet,bit}.json`).
 *
 * The file is an object keyed by the source's own abbreviation, and the
 * abbreviation is the whole record for a Ratchet — "0-60" is both its key
 * and its real name, which is why Ratchet entries carry no `names` at all.
 *
 * `desc` is deliberately absent from this type: it is Go-Shoot's own
 * written explanation, and the source policy allows this site to take
 * structured facts from an unknown-rights source but not to republish its
 * prose (see `src/lib/source-permission/gate.ts`).
 */
export interface GoShootEntry {
  /** Bits only: the ground-contact shape family. */
  group?: string;
  names?: { jap?: string; eng?: string; chi?: string; hasbro?: string; aka?: string };
  /** `stat[0]` is the weight in grams with a relative marker appended
   *  ("42+", "41=", "61-"). Later entries exist on Bits but their meaning
   *  is not documented anywhere in the source, so they are left alone. */
  stat?: (string | number)[];
  /** Playstyle, spin direction and construction tags, mixed in one list. */
  attr?: string[];
}

export interface GoShootRecord {
  abbr: string;
  entry: GoShootEntry;
}

export function parseGoShootFile(file: Record<string, GoShootEntry>): GoShootRecord[] {
  return Object.entries(file).map(([abbr, entry]) => ({ abbr, entry }));
}

function normalizeName(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

/** A record's own name: the English name when the source gives one, and the
 *  key itself for Ratchets, whose key *is* the name. */
function nameKeyOf(record: GoShootRecord): string {
  return normalizeName(record.entry.names?.eng ?? record.abbr);
}

function aliasesOf(record: GoShootRecord): string[] {
  return [
    // A one-character abbreviation ("A", "B") matches far too much to be a
    // useful search term.
    record.abbr.length >= 2 ? record.abbr : undefined,
    record.entry.names?.hasbro,
    record.entry.names?.aka,
  ].filter((value): value is string => Boolean(value?.trim()));
}

/** The source leaves a field as "" rather than omitting it (Samurai Steel
 *  ships with an empty `chi`), and a blank name is not a name. */
function presentText(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

export function goShootWeightOf(entry: GoShootEntry): number | undefined {
  const raw = entry.stat?.[0];
  if (typeof raw === "number") return raw > 0 ? raw : undefined;
  if (typeof raw !== "string") return undefined;

  const grams = Number.parseFloat(raw);
  return Number.isFinite(grams) && grams > 0 ? grams : undefined;
}

export function goShootSpinOf(entry: GoShootEntry): "right" | "left" | undefined {
  if (entry.attr?.includes("left")) return "left";
  if (entry.attr?.includes("right")) return "right";
  return undefined;
}

const BIT_SHAPES = ["flat", "round", "sharp", "multi"] as const;

export function goShootBitShapeOf(entry: GoShootEntry): (typeof BIT_SHAPES)[number] | undefined {
  return BIT_SHAPES.find((shape) => shape === entry.group);
}

/**
 * Folds Go-Shoot's structured facts onto Parts already built from the
 * official/app-derived sources, matched on the exact English name.
 *
 * Everything here is additive and never overwrites: a Chinese name or a
 * weight already carried by a Part came from a source higher in the field
 * authority order (ADR-0010), and a community compilation does not get to
 * overrule it. What Go-Shoot uniquely supplies is what nothing else does —
 * the Chinese names for 58 of 63 Blades, per-Part weights, spin direction,
 * and a Bit's ground-contact shape.
 */
export function mergeGoShootFacts(parts: Part[], records: GoShootRecord[]): Part[] {
  const byName = new Map<string, GoShootRecord>();
  for (const record of records) {
    const key = nameKeyOf(record);
    if (key) byName.set(key, record);
  }

  return parts.map((part) => {
    const record = byName.get(normalizeName(part.nameEn));
    if (!record) return part;

    const aliases = [...new Set([...part.aliases, ...aliasesOf(record)])]
      .filter((alias) => normalizeName(alias) !== normalizeName(part.nameEn));
    const weightGrams = part.weightGrams ?? goShootWeightOf(record.entry);
    const nameZhTw = part.nameZhTw ?? presentText(record.entry.names?.chi);
    const merged: Part = {
      ...part,
      aliases,
      ...(weightGrams === undefined ? {} : { weightGrams }),
      ...(nameZhTw === undefined ? {} : { nameZhTw }),
    };

    if (merged.type === "blade") {
      const spinDirection = merged.spinDirection ?? goShootSpinOf(record.entry);
      return spinDirection === undefined ? merged : { ...merged, spinDirection };
    }
    if (merged.type === "bit") {
      const shape = merged.shape ?? goShootBitShapeOf(record.entry);
      return shape === undefined ? merged : { ...merged, shape };
    }
    return merged;
  });
}
