import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { dirname, isAbsolute, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import {
  auditPhstudyBitIdentityParity,
  phstudyBitIdentityRowsSchema,
  presentPhstudyBitIdentityParity,
} from "../src/lib/official-parts/phstudy-bit-identity-parity.ts";
import {
  phstudyBitCuratedBaselineSchema,
  phstudyManifestSchema,
  publishedPartImagesSchema,
  requiredPhstudyDocumentPaths,
} from "../src/lib/official-parts/phstudy-bit-metadata.ts";
import { partsFileSchema } from "../src/lib/parts/schema.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const stagedRowsPath = join(root, "data", "sources", "phstudy", "parts-bit.json");
const partsPath = join(root, "data", "parts.json");
const manifestPath = join(root, "data", "sources", "phstudy", "manifest.json");
const imagesPath = join(root, "data", "part-images.json");
const curatedBaselinePath = join(root, "data", "phstudy-bit-curated-baseline.json");

function readJson(path: string): unknown {
  return JSON.parse(readFileSync(path, "utf8")) as unknown;
}

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function containedPath(rootPath: string, relativePath: string): string {
  const target = resolve(rootPath, relativePath);
  const fromRoot = relative(rootPath, target);
  if (fromRoot.startsWith("..") || isAbsolute(fromRoot)) {
    throw new Error(`Artifact path escapes its root: ${relativePath}`);
  }
  return target;
}

function outputFormat(args: string[]): "human" | "json" {
  const unknown = args.filter((arg) => arg !== "--json");
  if (unknown.length > 0) throw new Error(`Unknown argument: ${unknown.join(", ")}`);
  return args.includes("--json") ? "json" : "human";
}

async function main(): Promise<void> {
  const format = outputFormat(process.argv.slice(2));
  if (!existsSync(stagedRowsPath)) {
    throw new Error("Missing phstudy Bit snapshot. Run `npm run scrape:phstudy` first.");
  }

  const rows = phstudyBitIdentityRowsSchema.parse(readJson(stagedRowsPath));
  const parts = partsFileSchema.parse(readJson(partsPath));
  const manifest = phstudyManifestSchema.parse(readJson(manifestPath));
  const images = publishedPartImagesSchema.parse(readJson(imagesPath));
  const curatedBaseline = phstudyBitCuratedBaselineSchema.parse(readJson(curatedBaselinePath));
  const sourceDocuments: Record<string, { bytes: number; sha256: string }> = {};
  for (const path of requiredPhstudyDocumentPaths) {
    const sourceRoot = join(root, "data", "sources", "phstudy");
    const sourcePath = containedPath(sourceRoot, path);
    if (!existsSync(sourcePath)) continue;
    const bytes = readFileSync(sourcePath);
    sourceDocuments[path] = {
      bytes: bytes.byteLength,
      sha256: createHash("sha256").update(bytes).digest("hex"),
    };
  }
  const sourceImages: Record<string, {
    sha256: string;
    webpSha256: string;
    width: number;
    height: number;
  }> = {};
  for (const row of rows) {
    if (!row.image || sourceImages[row.image.url]) continue;
    const sourceRoot = join(root, "data", "sources", "phstudy");
    const sourcePath = containedPath(
      sourceRoot,
      row.image.url.replace(/^\/sources\/phstudy\//, ""),
    );
    if (!existsSync(sourcePath)) continue;
    const sourceBytes = readFileSync(sourcePath);
    const webp = await sharp(sourceBytes).webp().toBuffer();
    const webpMetadata = await sharp(webp).metadata();
    if (!webpMetadata.width || !webpMetadata.height) continue;
    sourceImages[row.image.url] = {
      sha256: createHash("sha256").update(sourceBytes).digest("hex"),
      webpSha256: createHash("sha256").update(webp).digest("hex"),
      width: webpMetadata.width,
      height: webpMetadata.height,
    };
  }
  const publishedImages: Record<string, { sha256: string; width: number; height: number }> = {};
  for (const part of parts) {
    if (part.type !== "bit") continue;
    const entry = images[part.id];
    if (!entry) continue;
    const imagePath = containedPath(join(root, "public"), entry.url.replace(/^\/+/, ""));
    if (!existsSync(imagePath)) continue;
    const bytes = readFileSync(imagePath);
    const metadata = await sharp(bytes).metadata();
    if (!metadata.width || !metadata.height) continue;
    publishedImages[part.id] = {
      sha256: createHash("sha256").update(bytes).digest("hex"),
      width: metadata.width,
      height: metadata.height,
    };
  }
  const report = auditPhstudyBitIdentityParity(rows, parts, {
    manifest,
    images,
    curatedBaseline,
    sourceDocuments,
    sourceImages,
    publishedImages,
  });
  const presentation = presentPhstudyBitIdentityParity(report, format);
  console.log(presentation.output);
  process.exitCode = presentation.exitCode;
}

main().catch((error: unknown) => {
  console.error(`Bit parity audit failed: ${messageOf(error)}`);
  process.exitCode = 1;
});
