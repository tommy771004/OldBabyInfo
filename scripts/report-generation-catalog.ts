import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { measureGenerationCatalogSize } from "../src/lib/generation-catalog/metrics.ts";
import { generationCatalogSnapshotSchema } from "../src/lib/generation-catalog/schema.ts";

const root = join(fileURLToPath(new URL(".", import.meta.url)), "..");
const snapshot = generationCatalogSnapshotSchema.parse(JSON.parse(
  readFileSync(join(root, "data", "generation-catalog.json"), "utf8"),
));

console.log(JSON.stringify(measureGenerationCatalogSize(snapshot.records), null, 2));
