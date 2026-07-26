/**
 * Writes only the reviewed, structured HackMD fixture into the public
 * Assessment dataset. This is deliberately a manual seed step: the source
 * page is a Discovery Source, not a licence to mirror its full text.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { assessmentsFileSchema } from "../src/lib/assessments/schema.ts";
import { importHackmdAssessments, mergeImportedAssessments, type HackmdAssessmentDraft } from "../src/lib/assessments/hackmd-import.ts";
import { partsFileSchema } from "../src/lib/parts/schema.ts";
import { eventsFileSchema } from "../src/lib/events/schema.ts";
import { eventLeadsFileSchema, mergeEventLeads } from "../src/lib/events/leads.ts";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const fixturePath = join(root, "data", "hackmd-assessment-fixture.json");
const outputPath = join(root, "data", "assessments.json");

function readJson(path: string): unknown {
  return JSON.parse(readFileSync(path, "utf8"));
}

function main() {
  const drafts = readJson(fixturePath) as HackmdAssessmentDraft[];
  const parts = partsFileSchema.parse(readJson(join(root, "data", "parts.json")));
  const events = eventsFileSchema.parse(readJson(join(root, "data", "events.json")));
  const result = importHackmdAssessments(
    drafts,
    new Set(parts.map((part) => part.id)),
    new Set(events.map((event) => event.id)),
  );

  if (result.needsReview.length > 0) {
    console.error("Assessment fixture contains unresolved Needs Review items:");
    for (const item of result.needsReview) console.error(`  ${item.sourceKey}: ${item.reason} (${item.subjectId})`);
    process.exit(1);
  }

  const previousAssessments = assessmentsFileSchema.parse(readJson(outputPath));
  const validated = assessmentsFileSchema.parse(mergeImportedAssessments(previousAssessments, result.assessments));
  writeFileSync(outputPath, JSON.stringify(validated, null, 2) + "\n");
  const leadsPath = join(root, "data", "event-leads.json");
  const previousLeads = eventLeadsFileSchema.parse(readJson(leadsPath));
  const validatedLeads = eventLeadsFileSchema.parse(mergeEventLeads(previousLeads, result.eventLeads));
  writeFileSync(leadsPath, JSON.stringify(validatedLeads, null, 2) + "\n");
  console.log(`Wrote ${validated.length} source-labelled assessments.`);
  if (result.eventLeads.length > 0) console.log(`Retained ${result.eventLeads.length} Event leads without changing official Events.`);
}

try {
  main();
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
