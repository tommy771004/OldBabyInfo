/**
 * Downloads every Part photo into this repo and rewrites data/part-images.json
 * to point at the local copies.
 *
 * This reverses the earlier decision recorded in generate-part-images.ts,
 * which deliberately linked to community-hosted URLs and never copied the
 * files. Self-hosting means the site no longer spends anyone else's
 * bandwidth and no longer breaks when a third-party host rotates a URL — but
 * it also means this repo now contains copies of photographs it did not
 * take. They are TAKARA TOMY product shots, catalogued by the Go-Shoot and
 * BeyBrew community projects; both are credited on the site's own source
 * list, and `data/community-source-policy.json` records what is known about
 * each one's rights.
 *
 * Two sources, in priority order:
 *
 * 1. Go-Shoot (`/x/img/{type}/{abbr}.png`) — keyed by the source's own
 *    abbreviation, which this repo already stores on each Part as an alias.
 *    Preferred because it covers more Parts (110 Blades / 52 Bits / 37
 *    Ratchets) and every photo is shot the same way.
 * 2. Whatever data/part-images.json already resolved (BeyBrew's index,
 *    hosted on postimg.cc) for anything Go-Shoot doesn't carry.
 *
 * Run: node scripts/download-part-images.ts
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import sharp from "sharp";
import { partsFileSchema, type Part } from "../src/lib/parts/schema.ts";
import { readFileSync } from "node:fs";
import partsJson from "../data/parts.json" with { type: "json" };

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const OUTPUT_DIR = join(ROOT, "public", "parts");
const MANIFEST_PATH = join(ROOT, "data", "part-images.json");
const PUBLIC_PREFIX = "/parts";

const GO_SHOOT_DB = [
  ["blade", "https://go-shoot.github.io/x/db/part-blade.json"],
  ["blade", "https://go-shoot.github.io/x/db/part-blade-collab.json"],
  ["ratchet", "https://go-shoot.github.io/x/db/part-ratchet.json"],
  ["bit", "https://go-shoot.github.io/x/db/part-bit.json"],
] as const;

interface GoShootEntry {
  names?: { eng?: string };
}

interface ImageEntry {
  url: string;
  width: number;
  height: number;
}

function normalize(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

/** A Part id can contain spaces ("LIGHTNING L-DRAGO"); a filename served
 *  over HTTP should not. Ids are unique and this mapping is checked for
 *  collisions below, so the file name stays traceable to its Part. */
function fileNameOf(partId: string): string {
  return partId.replace(/[^A-Za-z0-9._-]+/g, "_");
}

/** Go-Shoot files are keyed by abbreviation; Ratchets have no `names` at all
 *  because the key ("0-60") is already the Part's real name. */
async function fetchGoShootAbbrs(): Promise<Map<string, string>> {
  const byPartName = new Map<string, string>();

  for (const [partType, url] of GO_SHOOT_DB) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`);
    const file = await res.json() as Record<string, GoShootEntry>;
    for (const [abbr, entry] of Object.entries(file)) {
      const name = entry.names?.eng ?? abbr;
      byPartName.set(`${partType}:${normalize(name)}`, abbr);
    }
  }

  return byPartName;
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * GitHub Pages rate-limits a burst of a few hundred requests, and a
 * throttled response looks exactly like a missing file — an earlier run of
 * this script silently "lost" 37 photos that way. Space the requests out and
 * retry with a backoff so a 429 is never mistaken for a 404.
 */
async function download(url: string): Promise<Buffer | undefined> {
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const res = await fetch(url);
    if (res.ok) return Buffer.from(await res.arrayBuffer());
    if (res.status === 404) return undefined;
    await sleep(1500 * 2 ** attempt);
  }
  throw new Error(`Gave up on ${url} — the host kept refusing`);
}

async function main() {
  const parts = partsFileSchema.parse(partsJson);
  // Read from disk, not as a static import: a previous run rewrites this
  // file, and the fallback needs whatever remote URLs it still holds.
  const existing = JSON.parse(readFileSync(MANIFEST_PATH, "utf8")) as Record<string, ImageEntry>;
  const abbrs = await fetchGoShootAbbrs();

  mkdirSync(OUTPUT_DIR, { recursive: true });

  const manifest: Record<string, ImageEntry> = {};
  const fileNames = new Set<string>();
  const sourced = { goShoot: 0, existing: 0, missing: [] as string[] };

  for (const part of parts) {
    const abbr = abbrs.get(`${part.type}:${normalize(part.nameEn)}`);
    const candidates = [
      abbr ? `https://go-shoot.github.io/x/img/${part.type}/${abbr}.png` : undefined,
      // Already-local entries from a previous run must not be re-fetched as
      // if they were URLs.
      existing[part.id]?.url.startsWith("http") ? existing[part.id]!.url : undefined,
    ].filter((url): url is string => Boolean(url));

    let written = false;
    for (const [index, url] of candidates.entries()) {
      const buffer = await download(url);
      await sleep(120);
      if (!buffer) continue;

      // One format for every photo, so the manifest and the <Image> sizing
      // never have to care where a given picture came from.
      const webp = await sharp(buffer).webp({ quality: 82 }).toBuffer();
      const meta = await sharp(webp).metadata();
      if (!meta.width || !meta.height) continue;

      const fileName = `${fileNameOf(part.id)}.webp`;
      if (fileNames.has(fileName)) throw new Error(`Two Parts map to ${fileName}`);
      fileNames.add(fileName);

      writeFileSync(join(OUTPUT_DIR, fileName), webp);
      manifest[part.id] = {
        url: `${PUBLIC_PREFIX}/${fileName}`,
        width: meta.width,
        height: meta.height,
      };
      if (index === 0) sourced.goShoot += 1;
      else sourced.existing += 1;
      written = true;
      break;
    }

    if (!written) sourced.missing.push(`${part.type}:${part.nameEn}`);
  }

  const ordered = Object.fromEntries(Object.entries(manifest).sort(([a], [b]) => a.localeCompare(b)));
  writeFileSync(MANIFEST_PATH, `${JSON.stringify(ordered, null, 2)}\n`);

  console.log(JSON.stringify({
    parts: parts.length,
    written: Object.keys(manifest).length,
    fromGoShoot: sourced.goShoot,
    fromPreviousHost: sourced.existing,
    stillMissing: sourced.missing.length,
    missingSample: sourced.missing.slice(0, 10),
    outputDir: OUTPUT_DIR,
  }, null, 2));
}

await main();
