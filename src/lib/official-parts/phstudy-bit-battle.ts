import { z } from "zod";
import type { FiveStat, Part } from "../parts/schema.ts";
import { X_GENERATION_START_DATE } from "../parts/x-release-date.ts";
import {
  comparePhstudyRows,
  pickPhstudyRepresentative,
  projectPhstudyBitIdentity,
  type PhstudyBitIdentitySourceRow,
} from "./phstudy-bit-identity.ts";

export const phstudyBitSourceStatsSchema = z.object({
  attack: z.number(),
  defense: z.number(),
  stamina: z.number(),
  dash: z.number(),
  burst: z.number(),
});
export type PhstudyBitSourceStats = z.infer<typeof phstudyBitSourceStatsSchema>;

export const phstudyBitBattleRowFields = {
  stats: phstudyBitSourceStatsSchema.nullable(),
  partType: z.enum(["attack", "defense", "stamina", "balance"]).nullable().optional(),
  modelName: z.string().min(1).nullable().optional(),
  releaseAt: z.iso.datetime().nullable().optional(),
};

export const phstudyBitBattleRowSchema = z.object(phstudyBitBattleRowFields).passthrough();

export interface PhstudyBitBattleSourceRow extends Omit<PhstudyBitIdentitySourceRow, "stats"> {
  stats: PhstudyBitSourceStats | null;
  partType?: string | null;
  modelName?: string | null;
  releaseAt?: string | null;
}

type BitPart = Extract<Part, { type: "bit" }>;
type BitMode = BitPart["modes"][number];
type BitStatEdition = BitPart["statEditions"][number];

export interface PhstudyBitBattleProjection<Row extends PhstudyBitBattleSourceRow> {
  playstyle: BitPart["playstyle"];
  canonicalRow: Row | undefined;
  stats: FiveStat | undefined;
  modes: BitMode[];
  statEditions: BitStatEdition[];
}

const playstyles = new Set(["attack", "defense", "stamina", "balance"] as const);

/** phstudy supplies Mode tuples but not display labels. Ambiguous tuples need
 * an explicit, reviewable domain label instead of trusting the Part under audit. */
const modeLabelOverrides: Record<string, Record<string, string>> = {
  Op: {
    "20/50/50/10/30": "Defense Mode",
  },
};

function isPlaystyle(value: string | null | undefined): value is NonNullable<BitPart["playstyle"]> {
  return playstyles.has(value as NonNullable<BitPart["playstyle"]>);
}

export function toPhstudyBitStats(stats: PhstudyBitSourceStats): FiveStat {
  return {
    attack: stats.attack,
    defense: stats.defense,
    stamina: stats.stamina,
    xDash: stats.dash,
    burstResistance: stats.burst,
  };
}

function statsKey(stats: FiveStat): string {
  return [
    stats.attack,
    stats.defense,
    stats.stamina,
    stats.xDash,
    stats.burstResistance,
  ].join("/");
}

function sameStats(left: FiveStat, right: FiveStat): boolean {
  return statsKey(left) === statsKey(right);
}

function labelFor(partId: string, stats: FiveStat, position: number): string {
  const override = modeLabelOverrides[partId]?.[statsKey(stats)];
  if (override) return override;
  const ranked = (["attack", "defense", "stamina"] as const)
    .map((key) => ({ key, value: stats[key] }))
    .sort((left, right) => right.value - left.value);
  const [first, second] = ranked;
  if (first && second && first.value > second.value) {
    return `${first.key[0]!.toUpperCase()}${first.key.slice(1)} Mode`;
  }
  return `Mode ${position + 1}`;
}

function releaseDateOf(row: PhstudyBitBattleSourceRow): string | null {
  if (!row.releaseAt) return null;
  const date = row.releaseAt.slice(0, 10);
  return date < X_GENERATION_START_DATE ? null : date;
}

/** Shared battle-fact projection used by the phstudy merge and parity audit. */
export function projectPhstudyBitBattleFacts<Row extends PhstudyBitBattleSourceRow>(
  partId: string,
  rows: readonly Row[],
  existing?: BitPart,
): PhstudyBitBattleProjection<Row> {
  const representative = projectPhstudyBitIdentity(partId, rows).representative;
  const visible = rows.filter(
    (row): row is Row & { stats: PhstudyBitSourceStats } => !row.hiddenUpstream && row.stats !== null,
  );
  const stillCurrent = existing
    ? visible.filter((row) => sameStats(toPhstudyBitStats(row.stats), existing.stats))
    : [];
  const canonicalRow = pickPhstudyRepresentative(stillCurrent.length > 0 ? stillCurrent : visible);
  const stats = canonicalRow ? toPhstudyBitStats(canonicalRow.stats) : undefined;
  const alternateStats: FiveStat[] = [];
  for (const row of [...rows]
    .filter((candidate): candidate is Row & { stats: PhstudyBitSourceStats } =>
      candidate.hiddenUpstream && candidate.stats !== null)
    .sort(comparePhstudyRows)) {
    const projected = toPhstudyBitStats(row.stats);
    if (stats && sameStats(stats, projected)) continue;
    if (!alternateStats.some((held) => sameStats(held, projected))) alternateStats.push(projected);
  }
  const modes = stats && alternateStats.length > 0
    ? [
        { label: labelFor(partId, stats, 0), stats },
        ...alternateStats.map((alternate, index) => ({
          label: labelFor(partId, alternate, index + 1),
          stats: alternate,
        })),
      ]
    : [];

  const excludedKeys = new Set([
    ...(stats ? [statsKey(stats)] : []),
    ...modes.map((mode) => statsKey(mode.stats)),
  ]);
  const editionRows = new Map<string, Row & { stats: PhstudyBitSourceStats }>();
  for (const row of visible) {
    const key = statsKey(toPhstudyBitStats(row.stats));
    if (excludedKeys.has(key)) continue;
    const held = editionRows.get(key);
    if (!held) {
      editionRows.set(key, row);
      continue;
    }
    const rowDate = row.releaseAt ?? "9999";
    const heldDate = held.releaseAt ?? "9999";
    if (rowDate < heldDate || (rowDate === heldDate && comparePhstudyRows(row, held) < 0)) {
      editionRows.set(key, row);
    }
  }

  const statEditions = [...editionRows.values()]
    .map((row) => ({
      label: row.modelName || row.id,
      releaseAt: releaseDateOf(row),
      stats: toPhstudyBitStats(row.stats),
    }))
    .sort((left, right) =>
      (left.releaseAt ?? "").localeCompare(right.releaseAt ?? "") ||
      left.label.localeCompare(right.label));

  return {
    playstyle: isPlaystyle(representative?.partType) ? representative.partType : undefined,
    canonicalRow,
    stats,
    modes,
    statEditions,
  };
}

export function formatPhstudyBitStats(stats: FiveStat): string {
  return `A${stats.attack}/D${stats.defense}/S${stats.stamina}/X${stats.xDash}/B${stats.burstResistance}`;
}

export function formatPhstudyBitModes(modes: BitMode[]): string[] {
  return modes.map((mode) => `${mode.label}: ${formatPhstudyBitStats(mode.stats)}`);
}

export function formatPhstudyBitStatEditions(editions: BitStatEdition[]): string[] {
  return editions.map((edition) =>
    `${edition.label}@${edition.releaseAt ?? "unknown"}: ${formatPhstudyBitStats(edition.stats)}`);
}
