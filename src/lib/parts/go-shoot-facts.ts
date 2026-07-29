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
  sourceUrl?: string;
  sourceVersion?: string;
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
 * Go-Shoot is an unknown-rights community source. ADR-0010 permits its
 * observations and aliases, but does not permit promoting its names, weights,
 * spin direction, or shape into authoritative Part fields. Official and
 * app-derived sources must provide those structural facts.
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
    const addedAliases = aliases.some((alias) => !part.aliases.includes(alias));
    const provenance =
      addedAliases && record.sourceUrl && record.sourceVersion
        ? [
            ...(part.provenance ?? []),
            {
              sourceId: "go-shoot-x",
              sourceUrl: record.sourceUrl,
              sourceVersion: record.sourceVersion,
              authority: "community_source" as const,
              rightsStatus: "unknown" as const,
              fields: ["aliases" as const],
            },
          ]
        : part.provenance;
    return {
      ...part,
      aliases,
      provenance,
    };
  });
}
