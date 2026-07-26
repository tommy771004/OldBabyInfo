import type { Part } from "./schema.ts";

export interface GoShootPartRecord {
  abbr: string;
  names?: {
    eng?: string;
    hasbro?: string;
    aka?: string;
  };
}

function normalizeName(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function aliasesOf(record: GoShootPartRecord): string[] {
  return [
    record.abbr.length >= 2 ? record.abbr : undefined,
    record.names?.hasbro,
    record.names?.aka,
  ].filter((value): value is string => Boolean(value?.trim()));
}

/**
 * Merges only aliases attached to an exact English Part name in Go-Shoot's
 * structured DB. The source abbreviation is useful in combo notation; the
 * Hasbro and `aka` values are retained as source-provided player vocabulary.
 * One-character abbreviations are ignored because they create noisy matches.
 */
export function mergeGoShootAliases(parts: Part[], records: GoShootPartRecord[]): Part[] {
  const aliasesByName = new Map<string, string[]>();

  for (const record of records) {
    const sourceName = record.names?.eng;
    if (!sourceName) continue;
    const key = normalizeName(sourceName);
    if (!key) continue;
    const aliases = aliasesByName.get(key) ?? [];
    aliases.push(...aliasesOf(record));
    aliasesByName.set(key, aliases);
  }

  return parts.map((part) => {
    const aliases = aliasesByName.get(normalizeName(part.nameEn)) ?? [];
    return {
      ...part,
      aliases: [...new Set([...part.aliases, ...aliases])],
    };
  });
}
