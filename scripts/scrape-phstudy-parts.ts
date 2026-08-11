/**
 * phstudy Beyblade X browser scrape runner.
 *
 * `https://beyblade.phstudy.org/?category=Bit` is a client-side view: the page
 * ships no part markup, and `scripts/viewer.js` fetches everything from static
 * JSON under `/data/`. We therefore pull those documents directly instead of
 * parsing rendered HTML — same bytes the site itself reads, no headless browser.
 *
 * Output is staging only. Nothing here writes `data/parts.json` or
 * `data/part-images.json`; the source is registered in
 * `data/community-source-policy.json` as rights-unknown and disabled, so the
 * community-source gate stays honest until rights are cleared.
 *
 * Usage:
 *   node scripts/scrape-phstudy-parts.ts                  # merged Part categories, with images
 *   node scripts/scrape-phstudy-parts.ts --category=Bit   # explicit Bit-only staging
 *   node scripts/scrape-phstudy-parts.ts --category=Blade
 *   node scripts/scrape-phstudy-parts.ts --all-categories
 *   node scripts/scrape-phstudy-parts.ts --skip-images
 */
import { createHash } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { z } from "zod";
import { requirePhstudyRefreshCategory } from "../src/lib/official-parts/phstudy-bit-refresh.ts";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, "..", "data", "sources", "phstudy");
const RAW_DIR = join(OUT_DIR, "raw");
const IMAGE_DIR = join(OUT_DIR, "images");

const SOURCE_ID = "phstudy-beyblade-x";
const BASE_URL = "https://beyblade.phstudy.org";
const userAgent = "OldBabyInfo part-data-bot/1.0 (https://oldbabyinfo.dev/data-policy)";

/**
 * The documents that actually feed a Part. `viewer.js` also loads
 * `hasbro_products.json` (retail photo catalog), `products_multilang.json`
 * (product listings), `manuals.json` and `announcements.json` — all site
 * furniture rather than part data, so none of them are fetched.
 */
const RAW_DOCUMENTS = [
  "data/main.json",
  "data/hardcoded.json",
  "data/hasbro.json",
  "data/part_colors.json",
  "data/part_weights.json",
  "data/part_code_names.json",
] as const;

const CATEGORIES = [
  "Series",
  "Blade",
  "Ratchet",
  "MainBlade",
  "AssistBlade",
  "LockChip",
  "Bit",
  "MetalBlade",
  "OverBlade",
] as const;
type Category = (typeof CATEGORIES)[number];
const DEFAULT_CATEGORIES: Category[] = ["Bit", "Ratchet", "Blade"];

/** Mirrors `folderMap` / `siteFolderMap` in viewer.js. */
const APP_FOLDER: Record<Category, string> = {
  Series: "Set",
  Blade: "Big",
  Ratchet: "Ratchet",
  MainBlade: "MainBlade",
  AssistBlade: "AssistBlade",
  LockChip: "LockChip",
  MetalBlade: "MetalBlade",
  OverBlade: "OverBlade",
  Bit: "Bit",
};
const SITE_FOLDER: Record<Category, string> = { ...APP_FOLDER, Series: "Blade", Blade: "Blade" };

// Upstream uses null and absence interchangeably, so every optional is nullish.
const localizedSchema = z.record(z.string(), z.string().nullish()).nullish();
const itemSchema = z
  .object({
    id: z.string().min(1),
    group_id: z.string().nullish(),
    en_name: z.string().nullish(),
    name: localizedSchema,
    catalog_title: localizedSchema,
    description: localizedSchema,
    description_rotation_left: localizedSchema,
    defaultStatus: z.record(z.string(), z.union([z.number(), z.string(), z.null()])).nullish(),
    type: z.string().nullish(),
    ruby: z.string().nullish(),
    yomi: z.string().nullish(),
    set_id: z.string().nullish(),
    base_set_id: z.string().nullish(),
    package_id: z.string().nullish(),
    blade_id: z.string().nullish(),
    release_at: z.string().nullish(),
    tags: z.array(z.string()).nullish(),
    model_name: z.string().nullish(),
    invalid: z.boolean().nullish(),
    mode_change_bit: z.boolean().nullish(),
    collection_order: z.number().nullish(),
    collection_visible: z.record(z.string(), z.boolean()).nullish(),
  })
  .loose();
type SourceItem = z.infer<typeof itemSchema>;

const weightSchema = z.object({ weight_g: z.number().nullish(), size: z.string().nullish() }).loose();
const codeNameSchema = z.object({ type: z.string().nullish(), name: localizedSchema }).loose();

type Manifest = {
  sourceId: string;
  sourceUrl: string;
  fetchedAt: string;
  categories: Category[];
  documents: { path: string; url: string; bytes: number; sha256: string }[];
  normalized: { path: string; bytes: number; sha256: string }[];
  images: { count: number; missing: string[] };
};

type ImageRecord = {
  url: string;
  originalUrl: string;
  variant: "site-png" | "site-jpg" | "app-png";
  bytes: number;
  sha256: string;
};

function parseArgs() {
  const args = process.argv.slice(2);
  const requested = args
    .filter((arg) => arg.startsWith("--category="))
    .map((arg) => arg.slice("--category=".length));
  for (const value of requested) {
    if (!CATEGORIES.includes(value as Category)) {
      throw new Error(`Unknown category "${value}". Expected one of: ${CATEGORIES.join(", ")}`);
    }
  }
  return {
    categories: args.includes("--all-categories")
      ? [...CATEGORIES]
      : requested.length > 0
        ? (requested as Category[])
        : DEFAULT_CATEGORIES,
    skipImages: args.includes("--skip-images"),
  };
}

const sha256 = (buffer: Buffer) => createHash("sha256").update(buffer).digest("hex");
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** Retries transient failures only; a 404 is an answer, not an error. */
async function fetchBuffer(url: string, attempt = 0): Promise<{ status: number; buffer: Buffer }> {
  try {
    const response = await fetch(url, { headers: { "user-agent": userAgent } });
    if (response.status >= 500 && attempt < 2) {
      await sleep(500 * (attempt + 1));
      return fetchBuffer(url, attempt + 1);
    }
    return { status: response.status, buffer: Buffer.from(await response.arrayBuffer()) };
  } catch (error) {
    if (attempt < 2) {
      await sleep(500 * (attempt + 1));
      return fetchBuffer(url, attempt + 1);
    }
    throw error;
  }
}

async function fetchDocuments(): Promise<{ manifest: Manifest["documents"]; byPath: Map<string, unknown> }> {
  const manifest: Manifest["documents"] = [];
  const byPath = new Map<string, unknown>();
  for (const path of RAW_DOCUMENTS) {
    const url = `${BASE_URL}/${path}`;
    const { status, buffer } = await fetchBuffer(url);
    if (status !== 200) throw new Error(`${url} returned ${status}`);
    const fileName = path.replace(/^data\//, "");
    writeFileSync(join(RAW_DIR, fileName), buffer);
    manifest.push({ path: `raw/${fileName}`, url, bytes: buffer.byteLength, sha256: sha256(buffer) });
    byPath.set(fileName, JSON.parse(buffer.toString("utf8")));
    console.log(`raw ${fileName} (${buffer.byteLength} bytes)`);
    await sleep(150);
  }
  return { manifest, byPath };
}

/** Series cards key their art off the bundled blade (viewer.js:1498). */
function imageIdFor(category: Category, item: SourceItem): string {
  if (category !== "Series") return item.id;
  return item.blade_id || item.id.replace(/^SR-/, "BL-");
}

type MergedItem = { item: SourceItem; originDocument: string; brandSource: "TT" | "Hasbro" };

/** Loose outer shape: one malformed row must not discard a whole document. */
const documentSchema = z
  .object({ data: z.record(z.string(), z.record(z.string(), z.unknown())) })
  .loose();

/**
 * Reproduces `mergeMasterdata` (viewer.js:1132): main.json is authoritative and
 * the two hand-authored overlays only fill ids it does not already define.
 * Reading main.json alone misses the Hasbro range and the hand-authored sets.
 */
function mergeCategory(byPath: Map<string, unknown>, dataKey: string): MergedItem[] {
  const overlays: { file: string; brandSource: "TT" | "Hasbro" }[] = [
    { file: "main.json", brandSource: "TT" },
    { file: "hardcoded.json", brandSource: "TT" },
    { file: "hasbro.json", brandSource: "Hasbro" },
  ];
  const merged = new Map<string, MergedItem>();
  for (const { file, brandSource } of overlays) {
    const parsed = documentSchema.safeParse(byPath.get(file));
    if (!parsed.success) {
      console.warn(`warn ${file}: unexpected document shape, skipped for ${dataKey}`);
      continue;
    }
    const bucket = parsed.data.data[dataKey];
    if (!bucket) continue;
    let rejected = 0;
    for (const [id, raw] of Object.entries(bucket)) {
      // hasbro.json carries a blank-keyed placeholder row; it is not a part.
      if (!id.trim() || merged.has(id)) continue;
      const item = itemSchema.safeParse(raw);
      if (!item.success || !item.data.id.trim()) {
        rejected += 1;
        continue;
      }
      merged.set(id, { item: item.data, originDocument: file, brandSource });
    }
    if (rejected > 0) console.warn(`warn ${file}/${dataKey}: ${rejected} row(s) failed validation`);
  }
  return [...merged.values()];
}

/**
 * Walks the same three candidates the page falls back through, so a part that
 * only exists in the app bundle still resolves.
 */
async function downloadImage(
  category: Category,
  imageId: string,
  targetDir: string,
): Promise<ImageRecord | null> {
  const candidates = [
    { variant: "site-png" as const, url: `${BASE_URL}/images/site/${SITE_FOLDER[category]}/${imageId}.png`, ext: "png" },
    { variant: "site-jpg" as const, url: `${BASE_URL}/images/site/${SITE_FOLDER[category]}/${imageId}.jpg`, ext: "jpg" },
    { variant: "app-png" as const, url: `${BASE_URL}/images/app/${APP_FOLDER[category]}/${imageId}.png`, ext: "png" },
  ];
  for (const candidate of candidates) {
    const { status, buffer } = await fetchBuffer(candidate.url);
    if (status !== 200 || buffer.byteLength === 0) continue;
    const fileName = `${imageId}.${candidate.ext}`;
    writeFileSync(join(targetDir, fileName), buffer);
    return {
      url: `/sources/phstudy/images/${category}/${fileName}`,
      originalUrl: candidate.url,
      variant: candidate.variant,
      bytes: buffer.byteLength,
      sha256: sha256(buffer),
    };
  }
  return null;
}

/** Bounded worker pool; keeps concurrent load on a small community host low. */
async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  worker: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  const results = new Array<R>(items.length);
  let cursor = 0;
  const runners = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (cursor < items.length) {
      const index = cursor++;
      const item = items[index];
      if (item === undefined) continue;
      results[index] = await worker(item, index);
      await sleep(150);
    }
  });
  await Promise.all(runners);
  return results;
}

async function main() {
  const { categories, skipImages } = parseArgs();
  mkdirSync(RAW_DIR, { recursive: true });
  mkdirSync(IMAGE_DIR, { recursive: true });

  const fetchedAt = new Date().toISOString();
  const { manifest: documents, byPath } = await fetchDocuments();

  const colors = z.record(z.string(), z.array(z.string())).parse(byPath.get("part_colors.json"));
  const weights = z.record(z.string(), weightSchema).parse(byPath.get("part_weights.json"));
  const codeNames = z
    .record(z.string(), z.record(z.string(), codeNameSchema))
    .parse(byPath.get("part_code_names.json"));

  const missingImages: string[] = [];
  const normalizedArtifacts: Manifest["normalized"] = [];
  let imageCount = 0;

  for (const category of categories) {
    const dataKey = category === "Series" ? "BeybladeSeries" : `BeybladeParts${category}`;
    const entries = requirePhstudyRefreshCategory(category, mergeCategory(byPath, dataKey));

    const categoryImageDir = join(IMAGE_DIR, category);
    if (!skipImages) mkdirSync(categoryImageDir, { recursive: true });

    const imageRecords = new Map<string, ImageRecord>();
    if (!skipImages) {
      // viewer.js:1500 hides `R`-suffixed ids from its own listing, but their art
      // is still served, so we fetch it and mark the record `hiddenUpstream`.
      const targets = [...new Set(entries.map(({ item }) => imageIdFor(category, item)))];
      console.log(`${category}: fetching ${targets.length} images`);
      const records = await mapWithConcurrency(targets, 4, (imageId) =>
        downloadImage(category, imageId, categoryImageDir),
      );
      targets.forEach((imageId, index) => {
        const record = records[index];
        if (record) {
          imageRecords.set(imageId, record);
          imageCount += 1;
        } else {
          missingImages.push(`${category}/${imageId}`);
        }
      });
    }

    const normalized = entries.map(({ item, originDocument, brandSource }) => {
      const imageId = imageIdFor(category, item);
      const groupId = item.group_id ?? null;
      return {
        id: item.id,
        // Per-SKU upstream vs per-identity locally: groupId is the dedup key.
        groupId,
        category,
        originDocument,
        brandSource,
        hiddenUpstream: imageId.endsWith("R"),
        enName: item.en_name ?? null,
        name: item.name ?? null,
        catalogTitle: item.catalog_title ?? null,
        codeName: groupId ? (codeNames[category]?.[groupId] ?? null) : null,
        partType: item.type ?? null,
        stats: item.defaultStatus ?? null,
        description: item.description ?? null,
        descriptionRotationLeft: item.description_rotation_left ?? null,
        ruby: item.ruby ?? null,
        yomi: item.yomi ?? null,
        setId: item.set_id ?? null,
        baseSetId: item.base_set_id ?? null,
        packageId: item.package_id ?? null,
        modelName: item.model_name ?? null,
        releaseAt: item.release_at ?? null,
        tags: item.tags ?? [],
        colors: colors[item.id] ?? [],
        weight: weights[item.id] ?? null,
        invalid: item.invalid ?? false,
        modeChangeBit: item.mode_change_bit ?? null,
        collectionOrder: item.collection_order ?? null,
        collectionVisible: item.collection_visible ?? null,
        image: imageRecords.get(imageId) ?? null,
        provenance: {
          sourceId: SOURCE_ID,
          sourceUrl: `${BASE_URL}/?category=${category}`,
          rightsStatus: "unknown",
        },
      };
    });

    normalized.sort((a, b) => a.id.localeCompare(b.id));
    const outPath = join(OUT_DIR, `parts-${category.toLowerCase()}.json`);
    const normalizedBytes = Buffer.from(`${JSON.stringify(normalized, null, 2)}\n`);
    writeFileSync(outPath, normalizedBytes);
    normalizedArtifacts.push({
      path: `parts-${category.toLowerCase()}.json`,
      bytes: normalizedBytes.byteLength,
      sha256: sha256(normalizedBytes),
    });
    console.log(`${category}: ${normalized.length} items -> ${outPath}`);
  }

  const manifest: Manifest = {
    sourceId: SOURCE_ID,
    sourceUrl: BASE_URL,
    fetchedAt,
    categories,
    documents,
    normalized: normalizedArtifacts,
    images: { count: imageCount, missing: missingImages },
  };
  writeFileSync(join(OUT_DIR, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);

  console.log(`\nimages: ${imageCount} saved, ${missingImages.length} missing`);
  console.log(`manifest: ${join(OUT_DIR, "manifest.json")}`);
}

await main();
