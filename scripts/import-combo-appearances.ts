/** Offline review import. Never fetches sources, invokes models, or publishes. */
import { randomUUID } from "node:crypto";
import { closeSync, existsSync, openSync, readFileSync, renameSync, statSync, unlinkSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { mergeComboAppearanceReviews } from "../src/lib/combo-appearances.ts";
import { eventsFileSchema } from "../src/lib/events/schema.ts";
import { partsFileSchema } from "../src/lib/parts/schema.ts";
import { stableJson } from "../src/lib/data-writer.ts";

const usage = "Usage: npm run import:combo-appearances -- <review.json> [--parts <file>] [--events <file>] [--output <existing-file>] [--dry-run | --write]";
function main() {
  const args = process.argv.slice(2);
  const review = args.shift();
  if (!review || review.startsWith("--")) throw new Error(usage);
  const root = join(dirname(fileURLToPath(import.meta.url)), "..", "data");
  const paths: Record<string, string> = {
    "--parts": join(root, "parts.json"), "--events": join(root, "events.json"),
    "--output": join(root, "combo-appearances.json"),
  };
  const seen = new Set<string>();
  let mode: string | undefined;
  while (args.length) {
    const arg = args.shift()!;
    if ((arg === "--write" || arg === "--dry-run") && !mode) mode = arg;
    else if (Object.hasOwn(paths, arg) && !seen.has(arg)) {
      const value = args.shift();
      if (!value || value.startsWith("--")) throw new Error(usage);
      paths[arg] = resolve(value);
      seen.add(arg);
    } else throw new Error(`Unknown or repeated option: ${arg}. ${usage}`);
  }
  const output = paths["--output"]!;
  if ([review, paths["--parts"]!, paths["--events"]!].some((path) => resolve(path) === resolve(output))) {
    throw new Error("Output must be separate from review and reference files");
  }
  const before = readFileSync(output, "utf8");
  const result = mergeComboAppearanceReviews(
    JSON.parse(before), JSON.parse(readFileSync(review, "utf8")),
    partsFileSchema.parse(JSON.parse(readFileSync(paths["--parts"]!, "utf8"))),
    eventsFileSchema.parse(JSON.parse(readFileSync(paths["--events"]!, "utf8"))),
  );
  console.log(`Appearances: ${result.added} added, ${result.unchanged} unchanged, ${result.pending} pending, ${result.rejected} rejected.`);
  if (mode !== "--write") { console.log("Dry run: no files changed."); return; }
  if (!result.added) { console.log("No approved additions; output not rewritten."); return; }
  const temporary = `${output}.${randomUUID()}.tmp`;
  const descriptor = openSync(temporary, "wx", statSync(output).mode & 0o777);
  let closed = false;
  try {
    writeFileSync(descriptor, stableJson(result.records));
    closeSync(descriptor);
    closed = true;
    if (readFileSync(output, "utf8") !== before) throw new Error("Output changed during import; rerun against the current file");
    renameSync(temporary, output);
  } finally {
    if (!closed) closeSync(descriptor);
    if (existsSync(temporary)) unlinkSync(temporary);
  }
  console.log("Approved records written locally. Review the source evidence and Git diff before any PR merge; no publication performed.");
}
try { main(); } catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
