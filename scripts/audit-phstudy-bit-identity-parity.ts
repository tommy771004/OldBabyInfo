import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  auditPhstudyBitIdentityParity,
  phstudyBitIdentityRowsSchema,
  presentPhstudyBitIdentityParity,
} from "../src/lib/official-parts/phstudy-bit-identity-parity.ts";
import { partsFileSchema } from "../src/lib/parts/schema.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const stagedRowsPath = join(root, "data", "sources", "phstudy", "parts-bit.json");
const partsPath = join(root, "data", "parts.json");

function readJson(path: string): unknown {
  return JSON.parse(readFileSync(path, "utf8")) as unknown;
}

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function outputFormat(args: string[]): "human" | "json" {
  const unknown = args.filter((arg) => arg !== "--json");
  if (unknown.length > 0) throw new Error(`Unknown argument: ${unknown.join(", ")}`);
  return args.includes("--json") ? "json" : "human";
}

try {
  const format = outputFormat(process.argv.slice(2));
  if (!existsSync(stagedRowsPath)) {
    throw new Error("Missing phstudy Bit snapshot. Run `npm run scrape:phstudy` first.");
  }

  const rows = phstudyBitIdentityRowsSchema.parse(readJson(stagedRowsPath));
  const parts = partsFileSchema.parse(readJson(partsPath));
  const report = auditPhstudyBitIdentityParity(rows, parts);
  const presentation = presentPhstudyBitIdentityParity(report, format);
  console.log(presentation.output);
  process.exitCode = presentation.exitCode;
} catch (error) {
  console.error(`Bit identity parity audit failed: ${messageOf(error)}`);
  process.exitCode = 1;
}
