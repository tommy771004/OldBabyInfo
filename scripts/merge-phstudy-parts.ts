/**
 * Merges the staged phstudy Bit snapshot into the curated Part library.
 *
 * One-off maintenance script (ADR-0001: 零件人工策展) — NOT part of the build.
 * Run order matters:
 *
 *   1. node scripts/scrape-phstudy-parts.ts   (refresh data/sources/phstudy/)
 *   2. node scripts/merge-phstudy-parts.ts    (this script)
 *
 * !! Re-running `generate-parts-seed.ts` rebuilds data/parts.json from beybrew
 * !! alone and will erase everything merged here. Run this script again after
 * !! any `npm run generate:parts`.
 *
 * Conflict rule: on a field both sources carry, phstudy wins — an explicit
 * owner decision that overrides ADR-0010's field authority (which names
 * BeyBrew MasterData for X Part names, stats, modes and relationships) for the
 * Bit fields listed in each part's phstudy provenance entry. ADR-0010 has not
 * been amended; this script is the only place the override lives.
 *
 * Two things deliberately do NOT follow the source:
 *   - `nameZhTw` keeps the Part code, because phstudy's own `name.zh-TW` is
 *     also the code ("CX-11-01 Op"). The Chinese reading lives in `codeName`
 *     and is added to `aliases` instead — the search layer, per ADR-0005.
 *   - A replaced `nameEn` is appended to `aliases`, because the detail-page
 *     URL is `slugify(nameEn)` and old links must keep resolving.
 */
import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import sharp from "sharp";
import { z } from "zod";
import { partsFileSchema, type Part } from "../src/lib/parts/schema.ts";
import { X_GENERATION_START_DATE } from "../src/lib/parts/x-release-date.ts";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const STAGE_DIR = join(ROOT, "data", "sources", "phstudy");
const PARTS_PATH = join(ROOT, "data", "parts.json");
const IMAGES_MANIFEST_PATH = join(ROOT, "data", "part-images.json");
const PUBLIC_PARTS_DIR = join(ROOT, "public", "parts");

const SOURCE_ID = "phstudy-beyblade-x";
const SOURCE_URL = "https://beyblade.phstudy.org/?category=Bit";

/** First writer wins upstream (viewer.js:1132); the same order picks a group's
 *  representative row here, so a Takara Tomy row always beats a Hasbro one. */
const ORIGIN_RANK: Record<string, number> = {
  "main.json": 0,
  "hardcoded.json": 1,
  "hasbro.json": 2,
};

const stagedStatsSchema = z.object({
  attack: z.number(),
  defense: z.number(),
  stamina: z.number(),
  dash: z.number(),
  burst: z.number(),
});

const stagedImageSchema = z.object({
  url: z.string().min(1),
  originalUrl: z.url(),
  sha256: z.string().regex(/^[a-f0-9]{64}$/),
});

const stagedRowSchema = z.object({
  id: z.string().min(1),
  groupId: z.string().nullable(),
  originDocument: z.string().min(1),
  brandSource: z.enum(["TT", "Hasbro"]),
  hiddenUpstream: z.boolean(),
  codeName: z.object({ name: z.record(z.string(), z.string().nullish()).nullish() }).nullish(),
  partType: z.string().nullable(),
  stats: stagedStatsSchema.nullable(),
  releaseAt: z.string().nullable(),
  weight: z.object({ weight_g: z.number().nullish() }).nullish(),
  collectionOrder: z.number().nullable(),
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

function rank(row: StagedRow): [number, number, string] {
  return [ORIGIN_RANK[row.originDocument] ?? 9, row.collectionOrder ?? Number.MAX_SAFE_INTEGER, row.id];
}

function pickRepresentative(rows: StagedRow[]): StagedRow | undefined {
  return [...rows].sort((a, b) => {
    const [ao, ac, ai] = rank(a);
    const [bo, bc, bi] = rank(b);
    return ao - bo || ac - bc || ai.localeCompare(bi);
  })[0];
}

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

async function main() {
  const staged = z.array(stagedRowSchema).parse(readJson(join(STAGE_DIR, "parts-bit.json")));
  const manifest = manifestSchema.parse(readJson(join(STAGE_DIR, "manifest.json")));
  const parts = partsFileSchema.parse(readJson(PARTS_PATH));
  const images = z.record(z.string(), imageEntrySchema).parse(readJson(IMAGES_MANIFEST_PATH));

  const mainHash = manifest.documents.find((doc) => doc.path === "raw/main.json")?.sha256;
  if (!mainHash) throw new Error("manifest.json is missing raw/main.json — re-run scrape:phstudy");
  const sourceVersion = `sha256:${mainHash}`;

  const groups = new Map<string, StagedRow[]>();
  for (const row of staged) {
    if (!row.groupId?.trim()) continue;
    groups.set(row.groupId, [...(groups.get(row.groupId) ?? []), row]);
  }

  const existingBits = new Map(parts.filter((part) => part.type === "bit").map((part) => [part.id, part]));
  const merged: Part[] = [];
  const added: string[] = [];
  const updated: string[] = [];
  const renamed: { id: string; from: string; to: string }[] = [];
  const skipped: string[] = [];

  for (const [groupId, rows] of [...groups].sort(([a], [b]) => a.localeCompare(b))) {
    const base = pickRepresentative(rows.filter((row) => !row.hiddenUpstream)) ?? pickRepresentative(rows);
    const codeNames = rows.find((row) => row.codeName?.name)?.codeName?.name;
    const nameEn = codeNames?.["en-US"]?.trim();
    // No code name means no display name and no URL slug — upstream carries a
    // couple of placeholder rows (blank id, "■") that are not real Parts.
    if (!base || !base.stats || !nameEn) {
      skipped.push(groupId);
      continue;
    }

    const existing = existingBits.get(groupId);
    const stats = toFiveStat(base.stats);
    const existingModes: Mode[] = existing?.type === "bit" ? existing.modes : [];

    const alternate = pickRepresentative(rows.filter((row) => row.hiddenUpstream));
    const alternateStats = alternate?.stats ? toFiveStat(alternate.stats) : null;
    const modes: Mode[] =
      alternateStats && !sameStats(alternateStats, stats)
        ? [
            { label: labelFor(stats, existingModes, 0), stats },
            { label: labelFor(alternateStats, existingModes, 1), stats: alternateStats },
          ]
        : [];

    const nameJaReading = codeNames?.["ja-JP"]?.trim();
    const nameZhReading = codeNames?.["zh-TW"]?.trim();
    const aliases = new Set([...(existing?.aliases ?? []), groupId]);
    if (nameZhReading) aliases.add(nameZhReading);
    if (nameJaReading) aliases.add(nameJaReading);
    if (existing && existing.nameEn !== nameEn) {
      // The detail-page URL is slugify(nameEn); keep the old one resolvable.
      aliases.add(existing.nameEn);
      renamed.push({ id: groupId, from: existing.nameEn, to: nameEn });
    }

    const fields: string[] = ["nameEn", "aliases", "stats"];
    if (nameJaReading) fields.push("nameJa");
    if (!existing) fields.push("id");
    if (base.partType && playstyles.has(base.partType)) fields.push("playstyle");
    if (modes.length > 0) fields.push("modes");

    // "phstudy wins" applies to values, not to absence: when phstudy carries no
    // usable date the curated one stands, rather than being erased.
    const releaseAt = normalizeReleaseDate(rows) ?? existing?.releaseAt ?? null;
    if (normalizeReleaseDate(rows)) fields.push("releaseAt");
    const weightGrams = base.weight?.weight_g ?? undefined;
    if (weightGrams && weightGrams > 0) fields.push("weightGrams");

    const provenance = [
      ...(existing?.provenance ?? []),
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
      ...(nameJaReading ? { nameJa: `${groupId}（${nameJaReading}）` } : {}),
      // phstudy's own name.zh-TW is the Part code too, so the code stays.
      nameZhTw: existing?.nameZhTw ?? groupId,
      aliases: [...aliases].sort(),
      provenance,
      moldBatches: existing?.moldBatches ?? [],
      generation: "X",
      releaseAt,
      ...(weightGrams && weightGrams > 0 ? { weightGrams } : {}),
      type: "bit",
      stats,
      ...(base.partType && playstyles.has(base.partType)
        ? { playstyle: base.partType as "attack" | "defense" | "stamina" | "balance" }
        : {}),
      modes,
      statEditions: existing?.type === "bit" ? existing.statEditions : [],
    } as Part);

    (existing ? updated : added).push(groupId);
  }

  const mergedIds = new Set(merged.map((part) => part.id));
  const untouched = parts.filter((part) => part.type !== "bit" || !mergedIds.has(part.id));
  const nextParts = partsFileSchema.parse([...untouched, ...merged]);
  writeFileSync(PARTS_PATH, `${JSON.stringify(nextParts, null, 2)}\n`);

  // Images: one photo per Part, taken from the group's representative SKU.
  mkdirSync(PUBLIC_PARTS_DIR, { recursive: true });
  const nextImages: Record<string, ImageEntry> = { ...images };
  let converted = 0;
  let withoutImage = 0;
  for (const [groupId, rows] of groups) {
    if (!mergedIds.has(groupId)) continue;
    const base = pickRepresentative(rows.filter((row) => !row.hiddenUpstream && row.image));
    if (!base?.image) {
      withoutImage += 1;
      continue;
    }
    const sourcePath = join(STAGE_DIR, base.image.url.replace(/^\/sources\/phstudy\//, ""));
    const webp = await sharp(readFileSync(sourcePath)).webp().toBuffer();
    const meta = await sharp(webp).metadata();
    if (!meta.width || !meta.height) throw new Error(`Cannot size image for ${groupId}`);
    writeFileSync(join(PUBLIC_PARTS_DIR, `${groupId}.webp`), webp);
    nextImages[groupId] = {
      url: `/parts/${groupId}.webp`,
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
  const sortedImages = Object.fromEntries(
    Object.entries(nextImages).sort(([a], [b]) => a.localeCompare(b)),
  );
  writeFileSync(IMAGES_MANIFEST_PATH, `${JSON.stringify(sortedImages, null, 2)}\n`);

  console.log(`parts: ${nextParts.length} total (${added.length} new bits, ${updated.length} updated)`);
  console.log(`  added:   ${added.join(", ") || "none"}`);
  console.log(`  skipped: ${skipped.map((id) => JSON.stringify(id)).join(", ") || "none"}`);
  for (const { id, from, to } of renamed) {
    console.log(`  renamed: ${id} "${from}" -> "${to}" (URL /parts/${from} moves; old name kept as alias)`);
  }
  console.log(`images: ${converted} webp written, ${withoutImage} bit(s) left without a photo`);
}

await main();
