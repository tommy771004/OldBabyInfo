/**
 * One-off maintenance script (ticket 16) — NOT part of the build. Run
 * manually with `node scripts/generate-part-images.ts` after
 * generate-parts-seed.ts, then review the diff to `data/part-images.json`
 * before merging.
 *
 * The Part detail page is the one place on the site that shows an actual
 * official product photo (ADR: official image on the detail page, hand-
 * drawn symbols everywhere else). Those images are real TAKARA TOMY
 * product photography, not ours — this script only records which real,
 * already-public URL (hosted by the same beybrew community project
 * generate-parts-seed.ts already trusts for stats) corresponds to which
 * Part id.
 *
 * This is the discovery stage: it writes remote origins plus provenance into
 * the manifest without downloading them. Run download-part-images.ts next
 * to create the local WebP assets used by the detail page while retaining
 * those original URLs and source versions in the final manifest.
 *
 * Matching a Part id to an image key isn't a single clean rule — the
 * source repo's own key format varies by part type and sometimes reverses
 * word order (e.g. "Shinobi Knife" → "blade-knife-shinobi"). Parts with no
 * confident match are simply left out of the output; the detail page falls
 * back to no-image-shown rather than guessing wrong.
 *
 * Also records each image's own real pixel dimensions (fetched once here,
 * not re-derived at request time) — these photos are not all square
 * (e.g. 358×339), and Next.js's <Image> needs real intrinsic dimensions to
 * avoid stretching one axis to fit a guessed square.
 */
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import sharp from "sharp";
import { partsFileSchema, type Part } from "../src/lib/parts/schema.ts";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PARTS_PATH = join(__dirname, "..", "data", "parts.json");
const OUTPUT_PATH = join(__dirname, "..", "data", "part-images.json");

const IMAGE_URLS_URL =
  "https://raw.githubusercontent.com/yujinyuz/beybrew/main/src/data/image-urls.json";
const BEYBREW_COMMIT_URL =
  "https://api.github.com/repos/yujinyuz/beybrew/commits/main";

interface ImageUrlsFile {
  urls: Record<string, string>;
}

interface PartImage {
  url: string;
  originalUrl: string;
  width: number;
  height: number;
  sourceId: "beybrew-image-index";
  sourceUrl: string;
  sourceVersion: string;
  rightsStatus: "unknown";
  licenseUrl: null;
}

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`);
  return res.json() as Promise<T>;
}

async function fetchImageDimensions(url: string): Promise<{ width: number; height: number }> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`);
  const buffer = Buffer.from(await res.arrayBuffer());
  const meta = await sharp(buffer).metadata();
  if (!meta.width || !meta.height) throw new Error(`No dimensions for ${url}`);
  return { width: meta.width, height: meta.height };
}

function normalize(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function findImageUrl(part: Part, urls: Record<string, string>, keys: string[]): string | null {
  const n = normalize(part.nameEn);
  const words = part.nameEn.split(" ");
  const candidates = keys.flatMap((prefix) => [prefix + n]);
  if (words.length === 2) {
    const rev = normalize(words[1]! + words[0]!);
    candidates.push(...keys.map((prefix) => prefix + rev));
  }
  for (const c of candidates) {
    if (urls[c]) return urls[c];
  }
  // Substring fallback, scoped to keys carrying this part's own type prefix
  // so e.g. a Blade never accidentally matches a Bit's image key.
  for (const [key, url] of Object.entries(urls)) {
    if (keys.some((prefix) => key.startsWith(prefix)) && key.includes(n)) {
      return url;
    }
  }
  return null;
}

const KEY_PREFIXES: Record<Part["type"], string[]> = {
  blade: ["blade", "mainblade"],
  ratchet: ["ratchet"],
  bit: ["bit"],
};

async function main() {
  console.log("Fetching image-urls.json...");
  const [{ urls }, commit] = await Promise.all([
    fetchJson<ImageUrlsFile>(IMAGE_URLS_URL),
    fetchJson<{ sha: string }>(BEYBREW_COMMIT_URL),
  ]);
  const sourceUrl =
    `https://github.com/yujinyuz/beybrew/blob/${commit.sha}/src/data/image-urls.json`;

  const parts: Part[] = partsFileSchema.parse(
    JSON.parse(await import("node:fs/promises").then((fs) => fs.readFile(PARTS_PATH, "utf-8"))),
  );

  const result: Record<string, PartImage> = {};
  let matched = 0;

  for (const part of parts) {
    const url = findImageUrl(part, urls, KEY_PREFIXES[part.type]);
    if (!url) continue;
    try {
      const { width, height } = await fetchImageDimensions(url);
      result[part.id] = {
        url,
        originalUrl: url,
        width,
        height,
        sourceId: "beybrew-image-index",
        sourceUrl,
        sourceVersion: `commit:${commit.sha}`,
        rightsStatus: "unknown",
        licenseUrl: null,
      };
      matched++;
    } catch (err) {
      console.warn(`Skipping ${part.id}: ${(err as Error).message}`);
    }
  }

  console.log(`Matched ${matched} / ${parts.length} parts to a real image URL.`);
  writeFileSync(OUTPUT_PATH, JSON.stringify(result, null, 2) + "\n");
  console.log(`Wrote ${OUTPUT_PATH}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
