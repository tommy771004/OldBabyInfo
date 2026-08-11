/**
 * Merges the staged phstudy snapshot into the curated Part library —
 * Bit, Ratchet and Blade. Series and the CX-only Part kinds stay out; they
 * belong to the Generation Catalog (ADR-0013).
 *
 * One-off maintenance script (ADR-0001: 零件人工策展) — NOT part of the build.
 * Run order matters:
 *
 *   1. node scripts/scrape-phstudy-parts.ts   (refresh data/sources/phstudy/)
 *   2. node scripts/merge-phstudy-parts.ts    (this script)
 *
 * !! Re-running `generate-parts-seed.ts` rebuilds data/parts.json from beybrew
 * !! alone and will erase everything merged here. Run this script again after
 * !! any `npm run generate:parts`. Merging is idempotent.
 *
 * Conflict rule: on a field both sources carry, phstudy wins — an owner
 * decision that overrides ADR-0010's field authority (which names BeyBrew
 * MasterData for X Part names, stats, modes and relationships) for the fields
 * each Part's phstudy provenance entry lists. ADR-0013 records the scope.
 *
 * Absence is not a value: where phstudy carries nothing usable — a release
 * date, a Blade alias, a Blade's English name — the curated value stands.
 *
 * Localized names differ by category. Bits get "code + reading" from
 * `part_code_names.json` ("GF 齒輪平坦" / "GF（ギアフラット）"), so a combo written
 * "3-60GF" still reads off a list. Blades get their real names from phstudy's
 * `name` field with the SKU code, colorway and slot letter stripped
 * ("蒼龍神劍" / "ドランソード"). Ratchets are named by their own spec ("3-60").
 */
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import sharp from "sharp";
import { z } from "zod";
import { partsFileSchema, type Part } from "../src/lib/parts/schema.ts";
import { slugify } from "../src/lib/parts/slug.ts";
import { X_GENERATION_START_DATE } from "../src/lib/parts/x-release-date.ts";
import {
  comparePhstudyRows,
  phstudyOriginDocumentSchema,
  pickPhstudyRepresentative,
  projectPhstudyBitIdentity,
} from "../src/lib/official-parts/phstudy-bit-identity.ts";
import {
  BLADE_GROUP_ALIASES,
  BLADE_GROUP_SKIPS,
  BLADE_ID_RENAMES,
  BLADE_ID_TRAILING_NOISE,
  BLADE_NAME_TOKENS,
  segmentBladeName,
} from "./phstudy-blade-vocabulary.ts";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const STAGE_DIR = join(ROOT, "data", "sources", "phstudy");
const PARTS_PATH = join(ROOT, "data", "parts.json");
const IMAGES_MANIFEST_PATH = join(ROOT, "data", "part-images.json");
const CATALOG_PATH = join(ROOT, "data", "generation-catalog.json");
const REDIRECTS_PATH = join(ROOT, "data", "legacy-part-redirects.json");
const PUBLIC_PARTS_DIR = join(ROOT, "public", "parts");

const SOURCE_ID = "phstudy-beyblade-x";
const SOURCE_URL = "https://beyblade.phstudy.org/?category=Bit";

const stagedStatsSchema = z.object({
  attack: z.number(),
  defense: z.number(),
  stamina: z.number(),
  /** Bit-only dimensions; Blade and Ratchet rows omit them (ADR-0007). */
  dash: z.number().default(0),
  burst: z.number().default(0),
  /** Ratchet height in mm ("3-60" -> 60). Blades omit the field entirely. */
  height: z.number().default(0),
});

const stagedImageSchema = z.object({
  url: z.string().min(1),
  originalUrl: z.url(),
  sha256: z.string().regex(/^[a-f0-9]{64}$/),
});

const stagedRowSchema = z.object({
  id: z.string().min(1),
  groupId: z.string().nullable(),
  originDocument: phstudyOriginDocumentSchema,
  brandSource: z.enum(["TT", "Hasbro"]),
  hiddenUpstream: z.boolean(),
  codeName: z.object({ name: z.record(z.string(), z.string().nullish()).nullish() }).nullish(),
  name: z.record(z.string(), z.string().nullish()).nullish(),
  partType: z.string().nullable(),
  stats: stagedStatsSchema.nullable(),
  releaseAt: z.string().nullable(),
  weight: z.object({ weight_g: z.number().nullish() }).nullish(),
  collectionOrder: z.number().nullable(),
  modelName: z.string().nullable(),
  image: stagedImageSchema.nullable(),
});
type StagedRow = z.infer<typeof stagedRowSchema>;

const manifestSchema = z.object({
  documents: z.array(z.object({ path: z.string(), sha256: z.string() })),
});

const imageEntrySchema = z.object({
  url: z.string(),
  originalUrl: z.url(),
  width: z.number().positive(),
  height: z.number().positive(),
  sourceId: z.string(),
  sourceUrl: z.url(),
  sourceVersion: z.string(),
  rightsStatus: z.literal("unknown"),
  licenseUrl: z.url().nullable(),
});
type ImageEntry = z.infer<typeof imageEntrySchema>;

type FiveStat = { attack: number; defense: number; stamina: number; xDash: number; burstResistance: number };
type Mode = { label: string; stats: FiveStat };

const playstyles = new Set(["attack", "defense", "stamina", "balance"]);

/** phstudy's own five dimensions, renamed to this repo's vocabulary. */
function toFiveStat(stats: z.infer<typeof stagedStatsSchema>): FiveStat {
  return {
    attack: stats.attack,
    defense: stats.defense,
    stamina: stats.stamina,
    xDash: stats.dash,
    burstResistance: stats.burst,
  };
}

const sameStats = (a: FiveStat, b: FiveStat) =>
  JSON.stringify(Object.entries(a).sort()) === JSON.stringify(Object.entries(b).sort());

/**
 * Mode labels are not a phstudy field, so they are recovered rather than
 * invented: first by matching an existing curated mode's stats, then by the
 * mode's own strictly-dominant dimension. A tie falls back to position.
 */
function labelFor(stats: FiveStat, existing: Mode[], position: number): string {
  const carried = existing.find((mode) => sameStats(mode.stats, stats));
  if (carried) return carried.label;
  const ranked = (["attack", "defense", "stamina"] as const)
    .map((key) => ({ key, value: stats[key] }))
    .sort((a, b) => b.value - a.value);
  const [first, second] = ranked;
  if (first && second && first.value > second.value) {
    return `${first.key[0]!.toUpperCase()}${first.key.slice(1)} Mode`;
  }
  return `Mode ${position + 1}`;
}

function normalizeReleaseDate(rows: StagedRow[]): string | null {
  const dates = rows.flatMap((row) => (row.releaseAt ? [row.releaseAt.slice(0, 10)] : []));
  if (dates.length === 0) return null;
  const earliest = dates.sort()[0]!;
  // Same clamp the beybrew seed applies: a pre-X date is not an X release.
  return earliest < X_GENERATION_START_DATE ? null : earliest;
}

function readJson<T>(path: string): T {
  return JSON.parse(readFileSync(path, "utf8")) as T;
}

const PLANS = [
  { category: "Bit", partType: "bit", stagedFile: "parts-bit.json" },
  { category: "Ratchet", partType: "ratchet", stagedFile: "parts-ratchet.json" },
  { category: "Blade", partType: "blade", stagedFile: "parts-blade.json" },
] as const;
type Plan = (typeof PLANS)[number];

/**
 * A phstudy display name is "<SKU code> <name><spec letters>[ colorway]", e.g.
 * "CX-05-01 ヘルズリーパーT" or "BXC-13蒼龍至尊S" — the separating space is not
 * always there. The trailing letters are the CX slot code, not part of the
 * Blade's name, so they come off too; that is only safe on the ja/zh strings,
 * where an ASCII tail cannot be a real word.
 */
function stripSkuLabel(value: string | null | undefined): string | undefined {
  if (!value) return undefined;
  const withoutCode = value.replace(/^[A-Z0-9]+(?:-[A-Z0-9]+)+\s*/, "");
  const withoutColorway = withoutCode.split(
    /\s*(?:ダブルメタルコート|メタルコート|金屬塗層|Metallic Coat|Double Metal Coat)/,
  )[0]?.trim();
  if (!withoutColorway) return undefined;
  const hasNonAscii = /[^\p{ASCII}]/u.test(withoutColorway);
  return (hasNonAscii ? withoutColorway.replace(/[A-Za-z]+$/, "").trim() : withoutColorway) || undefined;
}

/**
 * Blade ids need three upstream repairs before they can be identities (ADR-0013):
 * a stray trailing spec letter, an alternate spelling that split one Blade into
 * two groups, and a curated spelling phstudy has since corrected.
 */
function canonicalBladeId(groupId: string): string {
  const trimmed = BLADE_ID_TRAILING_NOISE[groupId] ?? groupId;
  return BLADE_GROUP_ALIASES[trimmed] ?? BLADE_ID_RENAMES[trimmed] ?? trimmed;
}

async function main() {
  const manifest = manifestSchema.parse(readJson(join(STAGE_DIR, "manifest.json")));
  const parts = partsFileSchema.parse(readJson(PARTS_PATH));
  const images = z.record(z.string(), imageEntrySchema).parse(readJson(IMAGES_MANIFEST_PATH));

  const mainHash = manifest.documents.find((doc) => doc.path === "raw/main.json")?.sha256;
  if (!mainHash) throw new Error("manifest.json is missing raw/main.json — re-run scrape:phstudy");
  const sourceVersion = `sha256:${mainHash}`;

  const merged: Part[] = [];
  const added: string[] = [];
  const updated: string[] = [];
  const renamed: { id: string; from: string; to: string }[] = [];
  const skipped: string[] = [];
  const imageSources: { id: string; rows: StagedRow[] }[] = [];

  // Harvested from what is already curated, so the hand-written token list only
  // has to cover what the existing Parts do not already teach.
  const bladeVocabulary: Record<string, string> = { ...BLADE_NAME_TOKENS };
  for (const part of parts) {
    if (part.type !== "blade") continue;
    for (const word of part.nameEn.split(/\s+/)) bladeVocabulary[word.toUpperCase()] ??= word;
  }

  for (const plan of PLANS satisfies readonly Plan[]) {
    const staged = z.array(stagedRowSchema).parse(readJson(join(STAGE_DIR, plan.stagedFile)));
    const groups = new Map<string, StagedRow[]>();
    for (const row of staged) {
      const raw = row.groupId?.trim();
      if (!raw) continue;
      if (plan.partType === "blade" && BLADE_GROUP_SKIPS.has(raw)) continue;
      const key = plan.partType === "blade" ? canonicalBladeId(raw) : raw;
      groups.set(key, [...(groups.get(key) ?? []), row]);
    }
    const existingOfType = new Map(
      parts
        .filter((part) => part.type === plan.partType)
        .map((part) => [
          plan.partType === "blade" ? (BLADE_ID_RENAMES[part.id] ?? part.id) : part.id,
          part,
        ]),
    );

  for (const [groupId, rows] of [...groups].sort(([a], [b]) => a.localeCompare(b))) {
    const bitIdentity = plan.partType === "bit"
      ? projectPhstudyBitIdentity(groupId, rows)
      : undefined;
    const base = bitIdentity?.representative ??
      pickPhstudyRepresentative(rows.filter((row) => !row.hiddenUpstream)) ??
      pickPhstudyRepresentative(rows);
    // Bits are named by `part_code_names.json`; Ratchets have no entry there and
    // are named by their own spec ("3-60"), which is already the group id.
    // Blades: keep the curated English name (phstudy only has run-together
    // capitals), and reconstruct one by vocabulary segmentation for new Parts.
    const nameEn =
      plan.partType === "ratchet"
        ? groupId
        : plan.partType === "blade"
          ? (existingOfType.get(groupId)?.nameEn ?? segmentBladeName(groupId, bladeVocabulary) ?? undefined)
          : bitIdentity?.nameEn;
    // Junk filter, per category. A Bit without a code name has no display name
    // and no URL slug (upstream carries a blank-id row and a "■" row). A Ratchet
    // without a height is an upstream placeholder — "RATCHET-integrated" and
    // friends, all-zero stats — and `ratchetSchema` requires a positive height,
    // so the schema itself draws the line.
    const isPlaceholder =
      plan.partType === "ratchet" ? !base?.stats || base.stats.height <= 0 : false;
    if (!base || !base.stats || !nameEn || isPlaceholder) {
      skipped.push(groupId);
      continue;
    }

    const existing = existingOfType.get(groupId);
    // Only Bit carries five dimensions; Blade and Ratchet are three (ADR-0007).
    const project = (value: FiveStat) =>
      plan.partType === "bit"
        ? value
        : { attack: value.attack, defense: value.defense, stamina: value.stamina };

    /**
     * A group can carry more than one stat tuple across its SKUs (the "2-60"
     * Ratchet ships both 16/8/6 and 10/13/7). The curated value is kept as
     * canonical whenever it still appears upstream — 以新的資料為準 decides
     * between sources, not between SKUs of one Part — and the rest become Stat
     * Editions rather than being discarded. See ADR-0007.
     */
    const visible = rows.filter((row) => !row.hiddenUpstream && row.stats);
    const stillCurrent = existing
      ? visible.filter(
          (row) =>
            JSON.stringify(project(toFiveStat(row.stats!))) === JSON.stringify(existing.stats),
        )
      : [];
    const canonicalRow = pickPhstudyRepresentative(stillCurrent.length > 0 ? stillCurrent : visible) ?? base;
    const stats = toFiveStat(canonicalRow.stats ?? base.stats);
    const existingModes: Mode[] = existing?.type === "bit" ? existing.modes : [];

    // `ratchetSchema` has no `modes`; only Bits physically transform.
    const alternate =
      plan.partType === "bit"
        ? pickPhstudyRepresentative(rows.filter((row) => row.hiddenUpstream))
        : undefined;
    const alternateStats = alternate?.stats ? toFiveStat(alternate.stats) : null;
    const modes: Mode[] =
      alternateStats && !sameStats(alternateStats, stats)
        ? [
            { label: labelFor(stats, existingModes, 0), stats },
            { label: labelFor(alternateStats, existingModes, 1), stats: alternateStats },
          ]
        : [];

    // Blades carry real localized names upstream (ドランソード / 蒼龍神劍) once the
    // SKU code and colorway suffix are stripped; Bits only have code readings.
    const localized = plan.partType === "blade"
      ? rows.map((row) => row.name ?? {}).find((name) => stripSkuLabel(name["ja-JP"]))
      : undefined;
    const nameJaReading = plan.partType === "blade"
      ? stripSkuLabel(localized?.["ja-JP"])
      : bitIdentity?.nameJaReading;
    const nameZhReading = plan.partType === "blade"
      ? stripSkuLabel(localized?.["zh-TW"])
      : bitIdentity?.nameZhTwReading;
    const nameJa = plan.partType === "bit" ? bitIdentity?.nameJa : nameJaReading;
    const nameZhTw = plan.partType === "bit" ? bitIdentity?.nameZhTw : nameZhReading;
    // Derived from the source, not accumulated: phstudy is the naming authority
    // for Bits, so a superseded name ("Disc Ball" before "Disk Ball") does not
    // linger. The trade-off is that a hand-added alias on a Bit is dropped on
    // the next merge — add it upstream or reconsider this line.
    // A Ratchet's id already is its nameEn, so a code alias would be noise.
    // Blade aliases are beybrew's abbreviations ("ArPg", "S2") that phstudy has
    // no equivalent for — absence is not new data, so the curated set stands.
    const aliases = new Set(
      plan.partType === "bit"
        ? bitIdentity?.aliases
        : plan.partType === "blade"
          ? (existing?.aliases ?? [])
          : [],
    );
    if (nameZhReading) aliases.add(nameZhReading);
    if (nameJaReading) aliases.add(nameJaReading);
    if (existing && existing.nameEn !== nameEn) {
      renamed.push({ id: groupId, from: existing.nameEn, to: nameEn });
    }

    // Every distinct non-canonical tuple, labelled and dated by its earliest
    // SKU — the same shape `build-stat-editions.ts` produces for beybrew.
    const canonicalKey = JSON.stringify(project(stats));
    const modeKeys = new Set(modes.map((mode) => JSON.stringify(project(mode.stats))));
    const editionRows = new Map<string, StagedRow>();
    for (const row of visible) {
      const key = JSON.stringify(project(toFiveStat(row.stats!)));
      if (key === canonicalKey || modeKeys.has(key)) continue;
      const held = editionRows.get(key);
      if (!held || (row.releaseAt ?? "9999") < (held.releaseAt ?? "9999")) editionRows.set(key, row);
    }
    const statEditions = [...editionRows.values()]
      .map((row) => ({
        label: row.modelName || row.id,
        // Same pre-X clamp the Part's own releaseAt uses; the schema refuses a
        // date before the generation started on editions too.
        releaseAt: normalizeReleaseDate([row]),
        stats: project(toFiveStat(row.stats!)),
      }))
      .sort((a, b) => (a.releaseAt ?? "").localeCompare(b.releaseAt ?? "") || a.label.localeCompare(b.label));

    const fields: string[] = ["nameEn", "stats"];
    if (statEditions.length > 0) fields.push("statEditions");
    if (aliases.size > 0) fields.push("aliases");
    if (nameJaReading) fields.push("nameJa");
    if (nameZhReading) fields.push("nameZhTw");
    // phstudy owns the id of a Part it introduced, and keeps owning it on the
    // next run — "is this Part new to the file?" would flip the claim off.
    const priorOwnsId = (existing?.provenance ?? []).some(
      (entry) => entry.sourceId !== SOURCE_ID && entry.fields.includes("id"),
    );
    if (!priorOwnsId) fields.push("id");
    if (base.partType && playstyles.has(base.partType)) fields.push("playstyle");
    if (modes.length > 0) fields.push("modes");
    if (plan.partType === "ratchet") fields.push("height");

    // "phstudy wins" applies to values, not to absence: when phstudy carries no
    // usable date the curated one stands, rather than being erased.
    const releaseAt = normalizeReleaseDate(rows) ?? existing?.releaseAt ?? null;
    if (normalizeReleaseDate(rows)) fields.push("releaseAt");
    // Weight sits on whichever SKU was actually put on a scale, not necessarily
    // the representative one, so fall back through the group in rank order.
    const weightGrams =
      base.weight?.weight_g ??
      [...rows]
        .sort(comparePhstudyRows)
        .find((row) => (row.weight?.weight_g ?? 0) > 0)?.weight?.weight_g ??
      undefined;
    if (weightGrams && weightGrams > 0) fields.push("weightGrams");

    // A `fields` list records which source supplied the value now stored. Once
    // phstudy's value wins a field, the older source no longer supplies it, so
    // its claim is withdrawn; an entry left claiming nothing is dropped.
    const claimed = new Set(fields);
    const priorProvenance = (existing?.provenance ?? [])
      // Re-running must not stack a second phstudy entry on top of its own
      // previous output — this script is meant to be run again after every
      // `generate:parts`, and on an already-merged file too.
      .filter((entry) => entry.sourceId !== SOURCE_ID)
      .map((entry) => ({ ...entry, fields: entry.fields.filter((field) => !claimed.has(field)) }))
      .filter((entry) => entry.fields.length > 0);

    const provenance = [
      ...priorProvenance,
      {
        sourceId: SOURCE_ID,
        sourceUrl: SOURCE_URL,
        sourceVersion,
        // main.json is an official app MasterData dump; the two overlays are
        // the site author's own hand-authored rows.
        authority: base.originDocument === "main.json" ? "official_app_derived" : "community_source",
        rightsStatus: "unknown",
        fields,
      },
    ];

    merged.push({
      ...(existing ?? {}),
      id: groupId,
      nameEn,
      // Code + reading, so a combo written "3-60GF" still reads off the list
      // while zh-TW and ja get their own name. `localizedNameOf` picks one of
      // these three per locale; the bare reading also lands in `aliases`, so
      // searching "加速" or "アクセル" alone still matches (ADR-0005).
      ...(nameJa ? { nameJa } : {}),
      nameZhTw: nameZhTw ?? existing?.nameZhTw ?? groupId,
      aliases: [...aliases].sort(),
      provenance,
      moldBatches: existing?.moldBatches ?? [],
      generation: "X",
      releaseAt,
      ...(weightGrams && weightGrams > 0 ? { weightGrams } : {}),
      type: plan.partType,
      stats: project(stats),
      ...(plan.partType === "ratchet"
        ? { height: canonicalRow.stats!.height }
        // Only Bits have R-rows to read a second form off; a Blade's curated
        // modes have no phstudy equivalent, so they are carried over untouched.
        : { modes: plan.partType === "blade" ? (existing?.type === "blade" ? existing.modes : []) : modes }),
      ...(base.partType && playstyles.has(base.partType)
        ? { playstyle: base.partType as "attack" | "defense" | "stamina" | "balance" }
        : {}),
      // Computed, not merged: phstudy covers the whole SKU space for these
      // categories, so a curated edition it does not reproduce is stale. This
      // is what drops "Tr"'s old edition, whose tuple is now its Attack Mode —
      // a mode is a different mechanic from an edition (ADR-0007).
      statEditions,
    } as Part);

    imageSources.push({ id: groupId, rows });
    (existing ? updated : added).push(groupId);
  }
  }

  /**
   * CX MainBlades leave `parts.json` (ADR-0013). phstudy files them under
   * `BeybladePartsMainBlade`, and the Generation Catalog already carries all 17
   * as accepted `main_blade` records — keeping them here was a second, thinner
   * representation of Parts that live elsewhere. Identified by upstream
   * classification, never by a hand-written id list.
   */
  const mainBladeIds = new Set(
    Object.values(
      z
        .object({ data: z.record(z.string(), z.record(z.string(), z.object({ group_id: z.string().nullish() }).loose())) })
        .parse(readJson(join(STAGE_DIR, "raw", "main.json"))).data.BeybladePartsMainBlade ?? {},
    ).flatMap((entry) => (entry.group_id?.trim() ? [entry.group_id.trim()] : [])),
  );
  // Four upstream ids carry the CX slot letter the curated id omits
  // ("B／BLITZ" -> BBLITZ vs BLITZ), so match on the suffix as well.
  const evicted = parts.filter(
    (part) =>
      part.type === "blade" &&
      [...mainBladeIds].some((group) => group === part.id || group.endsWith(part.id)),
  );

  const mergedKeys = new Set(merged.map((part) => `${part.type}:${part.id}`));
  const evictedKeys = new Set(evicted.map((part) => `${part.type}:${part.id}`));
  // A renamed Part was re-emitted under its new id; without this the original
  // row survives and two Parts claim the same slugify(nameEn) URL.
  const supersededKeys = new Set(
    Object.keys(BLADE_ID_RENAMES).map((id) => `blade:${id}`),
  );
  const untouched = parts.filter((part) => {
    const key = `${part.type}:${part.id}`;
    return !mergedKeys.has(key) && !evictedKeys.has(key) && !supersededKeys.has(key);
  });
  const nextParts = partsFileSchema.parse([...untouched, ...merged]);
  writeFileSync(PARTS_PATH, `${JSON.stringify(nextParts, null, 2)}\n`);

  // Images: one photo per Part, taken from the group's representative SKU.
  mkdirSync(PUBLIC_PARTS_DIR, { recursive: true });
  const nextImages: Record<string, ImageEntry> = { ...images };
  let converted = 0;
  let withoutImage = 0;
  for (const { id: groupId, rows } of imageSources) {
    const base = pickPhstudyRepresentative(rows.filter((row) => !row.hiddenUpstream && row.image));
    if (!base?.image) {
      withoutImage += 1;
      continue;
    }
    // `partImageSchema` restricts the public url to [\w.-], but a Part id may
    // hold a space ("LIGHTNING L-DRAGO"); the manifest key stays the real id.
    const fileStem = groupId.replace(/[^\w.-]+/g, "-");
    const sourcePath = join(STAGE_DIR, base.image!.url.replace(/^\/sources\/phstudy\//, ""));
    const webp = await sharp(readFileSync(sourcePath)).webp().toBuffer();
    const meta = await sharp(webp).metadata();
    if (!meta.width || !meta.height) throw new Error(`Cannot size image for ${groupId}`);
    writeFileSync(join(PUBLIC_PARTS_DIR, `${fileStem}.webp`), webp);
    nextImages[groupId] = {
      url: `/parts/${fileStem}.webp`,
      originalUrl: base.image.originalUrl,
      width: meta.width,
      height: meta.height,
      sourceId: SOURCE_ID,
      sourceUrl: SOURCE_URL,
      sourceVersion: `sha256:${createHash("sha256").update(webp).digest("hex")}`,
      rightsStatus: "unknown",
      licenseUrl: null,
    };
    converted += 1;
  }
  // An evicted or renamed Part leaves its photo behind; the manifest is keyed by
  // Part id, so a stale key points at a Part that no longer exists.
  const livingIds = new Set(nextParts.map((part) => part.id));
  const orphaned = Object.keys(nextImages).filter((id) => !livingIds.has(id));
  for (const id of orphaned) delete nextImages[id];

  const sortedImages = Object.fromEntries(
    Object.entries(nextImages).sort(([a], [b]) => a.localeCompare(b)),
  );
  writeFileSync(IMAGES_MANIFEST_PATH, `${JSON.stringify(sortedImages, null, 2)}\n`);

  console.log(`parts: ${nextParts.length} total (${added.length} new, ${updated.length} updated)`);
  console.log(`  added:   ${added.join(", ") || "none"}`);
  console.log(`  skipped: ${skipped.map((id) => JSON.stringify(id)).join(", ") || "none"}`);
  for (const { id, from, to } of renamed) {
    console.log(`  renamed: ${id} "${from}" -> "${to}" (detail URL moves to /parts/${to})`);
  }
  console.log(`images: ${converted} webp written, ${withoutImage} part(s) left without a photo`);
  /**
   * The detail URL is `slugify(nameEn)`, so evicting or renaming a Part breaks
   * a live address. This map is emitted here rather than hand-maintained,
   * because this script is what breaks them: an evicted CX MainBlade points at
   * its Generation Catalog record (where the Part still lives), a renamed Part
   * at its new slug. `next.config.ts` expands each into its locale variants.
   */
  const catalogRecords = z
    .object({ records: z.array(z.object({ id: z.string(), name: z.string(), partType: z.string().nullish() }).loose()) })
    .parse(readJson(CATALOG_PATH)).records;
  const mainBladeRecords = catalogRecords.filter((record) => record.partType === "main_blade");

  const redirects: { from: string; to: string; reason: string }[] = [];
  for (const part of evicted) {
    const record = mainBladeRecords.find((candidate) => {
      const token = candidate.name.split(" ")[0]?.replace(/／/g, "") ?? "";
      return token === part.id || token.endsWith(part.id);
    });
    if (!record) {
      console.warn(`warn: evicted ${part.id} has no catalog record — no redirect written`);
      continue;
    }
    redirects.push({
      from: `/parts/${slugify(part.nameEn)}`,
      to: `/parts/catalog/${record.id}`,
      reason: "moved-to-generation-catalog",
    });
  }
  for (const { from, to } of renamed) {
    redirects.push({ from: `/parts/${slugify(from)}`, to: `/parts/${slugify(to)}`, reason: "renamed" });
  }
  // Renames that already landed in an earlier merge: the current file no longer
  // remembers the old name, so they cannot be recomputed. Carrying the previous
  // output forward also means a future rename accumulates instead of replacing.
  const previous = existsSync(REDIRECTS_PATH)
    ? z.array(z.object({ from: z.string(), to: z.string(), reason: z.string() })).parse(readJson(REDIRECTS_PATH))
    : [
        { from: "/parts/disc-ball", to: "/parts/disk-ball", reason: "renamed" },
        { from: "/parts/yield", to: "/parts/yielding", reason: "renamed" },
      ];
  for (const entry of previous) {
    if (!redirects.some((existing) => existing.from === entry.from)) redirects.push(entry);
  }
  redirects.sort((a, b) => a.from.localeCompare(b.from));
  const liveSlugs = new Set(nextParts.map((part) => slugify(part.nameEn)));
  const stillLive = redirects.filter((entry) => liveSlugs.has(entry.from.replace("/parts/", "")));
  if (stillLive.length > 0) {
    throw new Error(`Redirect source still resolves to a Part: ${stillLive.map((r) => r.from).join(", ")}`);
  }
  writeFileSync(REDIRECTS_PATH, `${JSON.stringify(redirects, null, 2)}\n`);

  console.log(`redirects: ${redirects.length} -> ${REDIRECTS_PATH}`);
  console.log(`orphaned image entries dropped: ${orphaned.length}`);
  console.log(`evicted to Generation Catalog (CX MainBlade): ${evicted.length}`);
  console.log(`  ${evicted.map((part) => part.id).join(", ") || "none"}`);
}

await main();
