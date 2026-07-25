import type { FiveStat, ThreeStat } from "./schema.ts";

/** Real shape of MasterData.json's `defaultStatus` — rotation/height/weight
 *  are present but irrelevant here; dash/burst are the raw field names for
 *  what this codebase calls xDash/burstResistance. */
export interface RawDefaultStatus {
  rotation?: string | null;
  attack: number;
  defense: number;
  stamina: number;
  height?: number;
  dash?: number;
  burst?: number;
  weight?: number;
}

export interface RawMasterDataEntry {
  model_name: string;
  group_id: string;
  release_at?: string;
  defaultStatus: RawDefaultStatus;
}

export interface StatEdition<S = ThreeStat | FiveStat> {
  label: string;
  releaseAt: string | null;
  stats: S;
}

type StatKind = "three" | "five";

function isModeChange(entry: RawMasterDataEntry): boolean {
  return entry.model_name.includes("_ModeChange");
}

function normalizeStats(raw: RawDefaultStatus, kind: StatKind): ThreeStat | FiveStat {
  const base = { attack: raw.attack, defense: raw.defense, stamina: raw.stamina };
  if (kind === "three") return base;
  return { ...base, xDash: raw.dash ?? 0, burstResistance: raw.burst ?? 0 };
}

function statsKey(stats: ThreeStat | FiveStat): string {
  return JSON.stringify(stats);
}

function toDateOnly(iso: string): string {
  return iso.slice(0, 10);
}

/**
 * Given every raw MasterData entry sharing a Part's group_id, and the stats
 * already chosen as canonical (from beyparts.json), returns the OTHER
 * distinct stat-tuples found as Stat Editions — see ADR-0007. Mode-change
 * entries are a different mechanic (see beybrew's comboUtils.js) and are
 * excluded, not treated as editions.
 */
export function buildStatEditions(
  entries: RawMasterDataEntry[],
  canonicalStats: ThreeStat,
  statKind: "three",
): StatEdition<ThreeStat>[];
export function buildStatEditions(
  entries: RawMasterDataEntry[],
  canonicalStats: FiveStat,
  statKind: "five",
): StatEdition<FiveStat>[];
export function buildStatEditions(
  entries: RawMasterDataEntry[],
  canonicalStats: ThreeStat | FiveStat,
  statKind: StatKind,
): StatEdition<ThreeStat | FiveStat>[] {
  const canonicalKey = statsKey(canonicalStats);
  const groups = new Map<string, { entry: RawMasterDataEntry; stats: ThreeStat | FiveStat }[]>();

  for (const entry of entries) {
    if (isModeChange(entry)) continue;
    const stats = normalizeStats(entry.defaultStatus, statKind);
    const key = statsKey(stats);
    if (key === canonicalKey) continue;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push({ entry, stats });
  }

  const editions: StatEdition[] = [];
  for (const group of groups.values()) {
    const dated = group
      .filter((g) => g.entry.release_at)
      .sort((a, b) => a.entry.release_at!.localeCompare(b.entry.release_at!));
    const representative = dated[0] ?? group[0]!;
    editions.push({
      label: representative.entry.model_name,
      releaseAt: representative.entry.release_at
        ? toDateOnly(representative.entry.release_at)
        : null,
      stats: representative.stats,
    });
  }

  return editions;
}
