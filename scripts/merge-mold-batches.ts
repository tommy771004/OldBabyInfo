/** Offline, additive merge of explicitly reviewed Mold Batch rows. No network. */
import { randomUUID } from "node:crypto";
import { closeSync, existsSync, openSync, readFileSync, renameSync, statSync, unlinkSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { mergeReviewedMoldBatches } from "../src/lib/mold-batch/review.ts";
import type { Part } from "../src/lib/parts/schema.ts";
import { stableJson } from "../src/lib/data-writer.ts";

const usage = "Usage: npm run merge:mold-batches -- <review.json> [--parts <parts.json>] [--dry-run | --write]";

function main() {
  const args = process.argv.slice(2);
  const reviewPath = args.shift();
  if (!reviewPath || reviewPath.startsWith("--")) throw new Error(usage);
  let partsPath = join(dirname(fileURLToPath(import.meta.url)), "..", "data", "parts.json");
  let mode: "dry-run" | "write" | undefined;
  let customParts = false;
  while (args.length > 0) {
    const arg = args.shift();
    if (arg === "--parts" && !customParts) {
      const path = args.shift();
      if (!path || path.startsWith("--")) throw new Error(usage);
      partsPath = resolve(path);
      customParts = true;
    } else if ((arg === "--write" || arg === "--dry-run") && !mode) {
      mode = arg === "--write" ? "write" : "dry-run";
    } else {
      throw new Error(`Unknown or repeated option: ${arg}. ${usage}`);
    }
  }
  if (resolve(reviewPath) === resolve(partsPath)) throw new Error("Review and Parts must be separate files");
  const before = readFileSync(partsPath, "utf8");
  const reviews = JSON.parse(readFileSync(reviewPath, "utf8")) as unknown;
  const result = mergeReviewedMoldBatches(JSON.parse(before) as Part[], reviews);
  console.log(`Mold Batch review: ${result.added} added, ${result.unchanged} unchanged, ${result.pending} pending, ${result.rejected} rejected.`);
  if (mode !== "write") {
    console.log("Dry run: no files changed. Review the input and diff before using --write.");
    return;
  }
  if (result.added === 0) {
    console.log("No approved additions; Parts were not rewritten.");
    return;
  }

  // Stage beside the destination so rename is atomic. Do not truncate Parts on
  // an interrupted write; reject observed intervening edits before replacement.
  const temporary = `${partsPath}.${randomUUID()}.tmp`;
  // Acquire ownership before entering cleanup; an exclusive-open failure must
  // never remove a file created by somebody else.
  const descriptor = openSync(temporary, "wx", statSync(partsPath).mode & 0o777);
  let closed = false;
  try {
    writeFileSync(descriptor, stableJson(result.parts));
    closeSync(descriptor);
    closed = true;
    if (readFileSync(partsPath, "utf8") !== before) {
      throw new Error("Parts changed during review merge; rerun against the current file");
    }
    renameSync(temporary, partsPath);
  } finally {
    if (!closed) closeSync(descriptor);
    if (existsSync(temporary)) unlinkSync(temporary);
  }
  console.log("Approved additions written locally. No publication performed; review the Git diff and approval file before merging the PR.");
}

try {
  main();
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
