/**
 * One-off maintenance script (ADR-0001: 零件人工策展) — NOT part of the
 * build. Run manually with `node scripts/generate-parts-seed.ts` when new
 * parts release, then review the diff to `data/parts.json` before merging.
 *
 * Canonical names + stats come from beybrew's beyparts.json (community-
 * curated — see ADR-0007 on why we don't try to re-derive clean display
 * names from MasterData.json ourselves). Stat Edition history is discovered
 * by cross-referencing the same part's raw entries in MasterData.json.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { partsFileSchema, type Part } from "../src/lib/parts/schema.ts";
import {
  applyOfficialBitDimensions,
  buildStatEditions,
  type RawMasterDataEntry,
} from "../src/lib/parts/build-stat-editions.ts";
import {
  filterXEraEntries,
  X_GENERATION_START_DATE,
} from "../src/lib/parts/x-release-date.ts";
import { cleanLocalizedName } from "../src/lib/parts/clean-localized-name.ts";
import {
  mergeGoShootFacts,
  parseGoShootFile,
  type GoShootEntry,
  type GoShootRecord,
} from "../src/lib/parts/go-shoot-facts.ts";
import { refreshOfficialParts } from "../src/lib/official-parts/refresh.ts";
import { assertBeybrewRefreshAllowed } from "../src/lib/official-parts/refresh-policy.ts";

/** The richer raw shape actually present in MasterData.json — a superset of
 *  RawMasterDataEntry (which only declares what stat-edition extraction
 *  needs), so it's still assignable wherever that narrower type is expected. */
interface RawEntry extends RawMasterDataEntry {
  name?: Record<string, string>;
}

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT_PATH = join(__dirname, "..", "data", "parts.json");

const BEYPARTS_URL =
  "https://raw.githubusercontent.com/yujinyuz/beybrew/main/src/data/beyparts.json";
const MASTERDATA_URL =
  "https://raw.githubusercontent.com/yujinyuz/beybrew/main/MasterData.json";
const BEYBREW_COMMIT_URL =
  "https://api.github.com/repos/yujinyuz/beybrew/commits/main";
/** The source splits Blades across three files — the main list, the
 *  collaboration Blades (Dranzer, Driger, Pegasis and friends), and the CX
 *  divided Blades. The first two carry Parts this seed knows about; the
 *  divided file holds CX-only Part kinds, which live in the Generation
 *  Catalog rather than here. */
const GO_SHOOT_PART_URLS = [
  "https://go-shoot.github.io/x/db/part-blade.json",
  "https://go-shoot.github.io/x/db/part-blade-collab.json",
  "https://go-shoot.github.io/x/db/part-ratchet.json",
  "https://go-shoot.github.io/x/db/part-bit.json",
] as const;

interface BeypartsMode {
  label: string;
  attack: number;
  defense: number;
  stamina: number;
  xDash?: number;
  burstResistance?: number;
}

interface BeypartsEntry {
  name: string;
  altname?: string;
  alias?: string;
  /** Present on single-form parts; absent on parts with `modes` instead. */
  attack?: number;
  defense?: number;
  stamina?: number;
  xDash?: number;
  burstResistance?: number;
  /** The official four-way playstyle classification — present on blades
   *  and bits, absent on ratchets. See schema.ts's playstyleSchema. */
  type?: "attack" | "defense" | "stamina" | "balance";
  /** Present on parts that physically transform between forms (e.g.
   *  Scorpio Spear's X-DASH-triggered shape change) — see ADR-0007. */
  modes?: BeypartsMode[];
}

interface BeypartsFile {
  blades: BeypartsEntry[];
  ratchets: BeypartsEntry[];
  bits: BeypartsEntry[];
}

type GoShootPartRecordFile = Record<string, GoShootEntry>;

function normalizeKey(s: string): string {
  return s.toUpperCase().replace(/[^A-Z0-9]/g, "");
}

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`);
  return res.json() as Promise<T>;
}

async function fetchGoShootFacts(): Promise<GoShootRecord[]> {
  const files = await Promise.all(GO_SHOOT_PART_URLS.map(async (sourceUrl) => {
    const response = await fetch(sourceUrl);
    if (!response.ok) throw new Error(`Failed to fetch ${sourceUrl}: ${response.status}`);
    const body = await response.text();
    const sourceVersion = `sha256:${createHash("sha256").update(body).digest("hex")}`;
    return parseGoShootFile(JSON.parse(body) as GoShootPartRecordFile)
      .map((record) => ({ ...record, sourceUrl, sourceVersion }));
  }));
  return files.flat();
}

async function fetchMasterData(): Promise<{
  blades: RawEntry[];
  ratchets: RawEntry[];
  bits: RawEntry[];
}> {
  const raw = await fetchJson<{ masterData: string }>(MASTERDATA_URL);
  const inner = JSON.parse(raw.masterData) as { data: Record<string, RawEntry[]> };
  return {
    blades: [
      ...(inner.data.BeybladePartsBlade ?? []),
      ...(inner.data.BeybladePartsMainBlade ?? []),
    ],
    ratchets: inner.data.BeybladePartsRatchet ?? [],
    bits: inner.data.BeybladePartsBit ?? [],
  };
}

/**
 * Exact group_id match only. An earlier version also fell back to a
 * model_name substring check, which for short aliases like "T" or "N"
 * matched almost anything and silently collapsed distinct Bits into the
 * same id. Missing a match here just means empty statEditions for that
 * part (a safe degradation) — a wrong match causes real parts to vanish.
 */
function findMasterDataGroup(
  candidateKeys: string[],
  pool: RawEntry[],
): { groupId: string; entries: RawEntry[] } | null {
  for (const key of candidateKeys) {
    const entries = pool.filter((e) => normalizeKey(e.group_id ?? "") === key);
    if (entries.length > 0) {
      return { groupId: entries[0]!.group_id, entries };
    }
  }
  return null;
}

/**
 * The earliest-released SKU in a group consistently carries the plainest
 * title — later reissues add colorway/edition suffixes (verified across
 * Dran Sword, Wizard Arrow, Shark Edge, Crimson Garuda; see ADR-0007-style
 * reasoning in clean-localized-name.ts). Walks entries oldest-first and
 * takes the first one where cleanLocalizedName succeeds, so a placeholder
 * glyph on the very first release doesn't blank out the whole group.
 */
function localizedNamesOf(entries: RawEntry[]): { ja?: string; zhTw?: string } {
  const sorted = [...entries].sort((a, b) =>
    (a.release_at ?? "9999").localeCompare(b.release_at ?? "9999"),
  );

  let ja: string | undefined;
  let zhTw: string | undefined;
  for (const entry of sorted) {
    if (!ja) {
      const candidate = entry.name?.["ja-JP"];
      if (candidate) ja = cleanLocalizedName(candidate) ?? undefined;
    }
    if (!zhTw) {
      const candidate = entry.name?.["zh-TW"];
      if (candidate) zhTw = cleanLocalizedName(candidate) ?? undefined;
    }
    if (ja && zhTw) break;
  }
  return { ja, zhTw };
}

/** The Part's own release date — when this physical product first went on
 *  sale, as opposed to a Stat Edition's `releaseAt` (a later reissue). */
function earliestReleaseDateOf(entries: RawEntry[]): string | null {
  const dated = filterXEraEntries(entries).filter((e) => e.release_at);
  if (dated.length === 0) return null;
  const earliest = dated.reduce((a, b) =>
    (a.release_at ?? "") < (b.release_at ?? "") ? a : b,
  );
  return earliest.release_at!.slice(0, 10);
}

/** Ratchet height is encoded in the ratchet's own name ("3-60" -> 60,
 *  "M-85" -> 85) — the number after the last hyphen, whatever precedes it. */
function parseRatchetHeight(name: string): number {
  const match = name.match(/-(\d+)$/);
  if (!match) throw new Error(`Ratchet name "${name}" has no parseable height`);
  return Number(match[1]);
}

/** Top-level stats when present; otherwise the first mode's stats — a
 *  multi-mode part still needs a single default `stats` block so plain
 *  listing/sorting doesn't have to special-case it. See ADR-0007. */
function primaryStatsOf(e: BeypartsEntry): BeypartsMode {
  if (e.attack !== undefined && e.defense !== undefined && e.stamina !== undefined) {
    return { label: "default", attack: e.attack, defense: e.defense, stamina: e.stamina, xDash: e.xDash, burstResistance: e.burstResistance };
  }
  if (e.modes && e.modes.length > 0) return e.modes[0]!;
  throw new Error(`Part "${e.name}" has neither top-level stats nor modes`);
}

function toThreeStat(s: BeypartsMode) {
  return { attack: s.attack, defense: s.defense, stamina: s.stamina };
}

function toFiveStat(s: BeypartsMode) {
  return {
    attack: s.attack,
    defense: s.defense,
    stamina: s.stamina,
    xDash: s.xDash ?? 0,
    burstResistance: s.burstResistance ?? 0,
  };
}

/** `altname`/`alias` can be an empty string (not just absent) — `||` falls
 *  through to `name` in that case, `??` would not. */
function displayName(e: BeypartsEntry, preferred?: string): string {
  return preferred || e.name;
}

/**
 * Some catalog entries are structural placeholders, not real orderable
 * parts: "RATCHET-integrated BLADE", "Turbo (Ratchet Integrated Bit)" —
 * describing the CX-line fusion mechanic itself rather than a specific
 * product. All-zero stats reliably identifies them; no real released part
 * has zero in every dimension.
 */
function isStructuralPlaceholder(e: BeypartsEntry): boolean {
  if (e.modes && e.modes.length > 0) return false;
  return e.attack === 0 && e.defense === 0 && e.stamina === 0;
}

async function main() {
  // Reject before any network access. The domain refresh repeats the guard so
  // alternate callers cannot bypass it. Never rebuild a migrated library from
  // BeyBrew and hope a later, unavailable-on-CI staged merge restores it.
  // Retain the pre-existing legacy date normalization for unmigrated seeds.
  const previousRaw = JSON.parse(readFileSync(OUTPUT_PATH, "utf8")) as Part[];
  const previous = partsFileSchema.parse(previousRaw.map((part) => ({
    ...part,
    releaseAt:
      part.releaseAt && part.releaseAt < X_GENERATION_START_DATE
        ? null
        : part.releaseAt,
    statEditions: part.statEditions.filter((edition) =>
      !edition.releaseAt || edition.releaseAt >= X_GENERATION_START_DATE,
    ),
  })));
  assertBeybrewRefreshAllowed(previous);
  console.log("Fetching beyparts.json (canonical names + stats)...");
  const beyparts = await fetchJson<BeypartsFile>(BEYPARTS_URL);
  const beybrewCommit = await fetchJson<{ sha: string }>(BEYBREW_COMMIT_URL);
  const beybrewSourceVersion = `commit:${beybrewCommit.sha}`;

  console.log("Fetching MasterData.json (for Stat Edition history)...");
  const masterData = await fetchMasterData();
  console.log("Fetching Go-Shoot Part aliases (combo abbreviations + source names)...");
  const goShootFacts = await fetchGoShootFacts();

  const parts: Part[] = [];
  let matched = 0;
  let unmatched = 0;
  const provenanceFor = (
    groupMatched: boolean,
    beypartsFields: Array<
      "id" | "nameEn" | "aliases" | "stats" | "playstyle" | "modes" | "height"
    >,
  ): Part["provenance"] => [
    {
      sourceId: "beybrew-beyparts",
      sourceUrl: BEYPARTS_URL,
      sourceVersion: beybrewSourceVersion,
      authority: "community_source",
      rightsStatus: "structured_facts_only",
      fields: beypartsFields,
    },
    ...(groupMatched
      ? [{
          sourceId: "beybrew-masterdata",
          sourceUrl: MASTERDATA_URL,
          sourceVersion: beybrewSourceVersion,
          authority: "official_app_derived" as const,
          rightsStatus: "structured_facts_only" as const,
          fields: [
            "id",
            "nameJa",
            "nameZhTw",
            "releaseAt",
            "stats",
            "statEditions",
          ] as NonNullable<Part["provenance"]>[number]["fields"],
        }]
      : []),
  ];

  for (const entry of beyparts.blades) {
    if (isStructuralPlaceholder(entry)) continue;
    const keys = [normalizeKey(displayName(entry, entry.altname)), normalizeKey(entry.name)];
    const group = findMasterDataGroup(keys, masterData.blades);
    const primary = primaryStatsOf(entry);
    const stats = toThreeStat(primary);
    if (group) matched++;
    else unmatched++;
    const localized = group ? localizedNamesOf(group.entries) : {};

    parts.push({
      id: group?.groupId ?? normalizeKey(entry.name),
      type: "blade",
      nameEn: entry.name,
      nameJa: localized.ja,
      nameZhTw: localized.zhTw,
      generation: "X",
      releaseAt: group ? earliestReleaseDateOf(group.entries) : null,
      stats,
      playstyle: entry.type,
      modes: (entry.modes ?? []).map((m) => ({ label: m.label, stats: toThreeStat(m) })),
      statEditions: group
        ? buildStatEditions(filterXEraEntries(group.entries), stats, "three")
        : [],
      moldBatches: [],
      aliases: [],
      provenance: provenanceFor(Boolean(group), [
        ...(group ? [] : ["id" as const]),
        "nameEn",
        "stats",
        "playstyle",
        "modes",
      ]),
    });
  }

  for (const entry of beyparts.ratchets) {
    if (isStructuralPlaceholder(entry)) continue;
    const keys = [normalizeKey(displayName(entry, entry.altname)), normalizeKey(entry.name)];
    const group = findMasterDataGroup(keys, masterData.ratchets);
    const stats = toThreeStat(primaryStatsOf(entry));
    if (group) matched++;
    else unmatched++;
    const localizedRatchet = group ? localizedNamesOf(group.entries) : {};

    parts.push({
      id: group?.groupId ?? normalizeKey(entry.name),
      type: "ratchet",
      nameEn: displayName(entry, entry.altname),
      nameJa: localizedRatchet.ja,
      nameZhTw: localizedRatchet.zhTw,
      generation: "X",
      releaseAt: group ? earliestReleaseDateOf(group.entries) : null,
      stats,
      height: parseRatchetHeight(displayName(entry, entry.altname)),
      statEditions: group
        ? buildStatEditions(filterXEraEntries(group.entries), stats, "three")
        : [],
      moldBatches: [],
      aliases: [],
      provenance: provenanceFor(Boolean(group), [
        ...(group ? [] : ["id" as const]),
        "nameEn",
        "stats",
        "height",
      ]),
    });
  }

  for (const entry of beyparts.bits) {
    if (isStructuralPlaceholder(entry)) continue;
    const keys = [
      normalizeKey(displayName(entry, entry.alias)),
      normalizeKey(entry.name),
    ];
    const group = findMasterDataGroup(keys, masterData.bits);
    const primary = primaryStatsOf(entry);
    const sourceStats = toFiveStat(primary);
    if (group) matched++;
    else unmatched++;
    const localizedBit = group ? localizedNamesOf(group.entries) : {};
    const bitAliases = entry.alias && entry.alias !== entry.name ? [entry.alias] : [];
    const stats = group
      ? applyOfficialBitDimensions(sourceStats, group.entries)
      : sourceStats;
    const modes = (entry.modes ?? []).map((mode) => {
      const sourceModeStats = toFiveStat(mode);
      return {
        label: mode.label,
        stats: group
          ? applyOfficialBitDimensions(sourceModeStats, group.entries)
          : sourceModeStats,
      };
    });

    parts.push({
      id: group?.groupId ?? normalizeKey(entry.name),
      type: "bit",
      nameEn: entry.name,
      nameJa: localizedBit.ja,
      nameZhTw: localizedBit.zhTw,
      generation: "X",
      releaseAt: group ? earliestReleaseDateOf(group.entries) : null,
      stats,
      playstyle: entry.type,
      aliases: bitAliases,
      provenance: provenanceFor(Boolean(group), [
        ...(group ? [] : ["id" as const]),
        "nameEn",
        ...(bitAliases.length > 0 ? ["aliases" as const] : []),
        "stats",
        "playstyle",
        "modes",
      ]),
      modes,
      statEditions: group
        ? buildStatEditions(
            filterXEraEntries(group.entries),
            stats,
            "five",
            modes.map((mode) => mode.stats),
          )
        : [],
      moldBatches: [],
    });
  }

  // De-duplicate ids: two different beyparts entries can resolve to the same
  // MasterData group_id (rare, but seen with ratchet/bit alias collisions).
  // Keep the first, log the rest so a human can review.
  const seen = new Set<string>();
  const deduped: Part[] = [];
  for (const part of parts) {
    if (seen.has(part.id)) {
      console.warn(`Skipping duplicate id "${part.id}" (${part.nameEn})`);
      continue;
    }
    seen.add(part.id);
    deduped.push(part);
  }

  const withAliases = mergeGoShootFacts(deduped, goShootFacts);
  const validation = partsFileSchema.safeParse(withAliases);
  if (!validation.success) {
    console.error(`Generated seed data failed schema validation (${validation.error.issues.length} issues). First 15:`);
    for (const issue of validation.error.issues.slice(0, 15)) {
      const idx = issue.path[0];
      const part = typeof idx === "number" ? withAliases[idx] : undefined;
      console.error(`  [${part?.nameEn ?? "?"} / ${part?.type ?? "?"}] ${issue.path.join(".")}: ${issue.message}`);
    }
    process.exit(1);
  }

  const refresh = await refreshOfficialParts(previous, async () => ({
    sourceVersion: process.env.BEYBREW_SOURCE_VERSION ?? beybrewSourceVersion,
    parts: validation.data,
  }));
  if (refresh.status === "failed") {
    console.error(`Official Part refresh failed; keeping the previous seed: ${refresh.error}`);
    process.exit(1);
  }

  if (refresh.status === "unchanged") {
    console.log(`Official Part refresh unchanged at ${refresh.sourceVersion}; data/parts.json was not rewritten.`);
    return;
  }

  writeFileSync(OUTPUT_PATH, JSON.stringify(refresh.parts, null, 2) + "\n");
  console.log(
    `Wrote ${refresh.parts.length} parts to ${OUTPUT_PATH} from ${refresh.sourceVersion} (${matched} matched to MasterData, ${unmatched} unmatched — review before merging). ` +
      `Added: ${refresh.diff.added.length}; changed: ${refresh.diff.changed.length}; removed: ${refresh.diff.removed.length}.`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
