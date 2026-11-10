import { describe, expect, it } from "vitest";
import { z } from "zod";
import partsJson from "../../../data/parts.json" with { type: "json" };
import partImagesJson from "../../../data/part-images.json" with { type: "json" };
import eventsJson from "../../../data/events.json" with { type: "json" };
import leadsJson from "../../../data/event-leads.json" with { type: "json" };
import assessmentsJson from "../../../data/assessments.json" with { type: "json" };
import documentsJson from "../../../data/source-documents.json" with { type: "json" };
import catalogJson from "../../../data/generation-catalog.json" with { type: "json" };
import needsReviewJson from "../../../data/generation-catalog-needs-review.json" with { type: "json" };
import guidanceJson from "../../../data/mold-batch-guidance.json" with { type: "json" };
import { partsFileSchema } from "../parts/schema.ts";
import { partImagesFileSchema } from "../parts/repository.ts";
import { eventsFileSchema } from "../events/schema.ts";
import { eventLeadsFileSchema } from "../events/leads.ts";
import { assessmentsFileSchema } from "../assessments/schema.ts";
import { sourceDocumentsFileSchema } from "../source-documents/schema.ts";
import { generationCatalogSnapshotSchema } from "../generation-catalog/schema.ts";
import { guidanceFileSchema } from "../mold-batch/guidance.ts";
import { loadStaticData, shouldValidateStaticData } from "./static-data.ts";

describe("shouldValidateStaticData", () => {
  it("validates in tests, dev and scripts", () => {
    expect(shouldValidateStaticData({ NODE_ENV: "test" })).toBe(true);
    expect(shouldValidateStaticData({ NODE_ENV: "development" })).toBe(true);
    expect(shouldValidateStaticData({})).toBe(true);
  });

  it("validates during `next build`, which is the gate ADR-0001 relies on", () => {
    expect(shouldValidateStaticData({ NODE_ENV: "production", NEXT_PHASE: "phase-production-build" })).toBe(true);
  });

  it("skips only in a production server answering requests", () => {
    expect(shouldValidateStaticData({ NODE_ENV: "production" })).toBe(false);
    expect(shouldValidateStaticData({ NODE_ENV: "production", NEXT_PHASE: "phase-production-server" })).toBe(false);
  });
});

describe("loadStaticData", () => {
  const schema = z.array(z.object({ id: z.string() }));

  it("throws on invalid data wherever it validates", () => {
    expect(() => loadStaticData(schema, [{ id: 1 }], { NODE_ENV: "production", NEXT_PHASE: "phase-production-build" })).toThrow();
  });

  it("hands the committed value through untouched in production", () => {
    const json = [{ id: "a" }];
    expect(loadStaticData(schema, json, { NODE_ENV: "production" })).toBe(json);
  });
});

/*
 * Skipping the parse in production is only sound if parse returns exactly
 * what it was given. A schema that grows a `.default()`, a `.transform()`, or
 * starts stripping keys the file carries would make production read different
 * data from the build that validated it — this suite is where that surfaces.
 * Every file a repository loads through `loadStaticData` belongs here.
 */
describe("parse is the identity on every committed data file", () => {
  const files: [string, z.ZodType, unknown][] = [
    ["parts.json", partsFileSchema, partsJson],
    ["part-images.json", partImagesFileSchema, partImagesJson],
    ["events.json", eventsFileSchema, eventsJson],
    ["event-leads.json", eventLeadsFileSchema, leadsJson],
    ["assessments.json", assessmentsFileSchema, assessmentsJson],
    ["source-documents.json", sourceDocumentsFileSchema, documentsJson],
    ["generation-catalog.json", generationCatalogSnapshotSchema, catalogJson],
    ["generation-catalog-needs-review.json", generationCatalogSnapshotSchema, needsReviewJson],
    ["mold-batch-guidance.json", guidanceFileSchema, guidanceJson],
  ];

  it.each(files)("%s", (_name, schema, json) => {
    expect(schema.parse(json)).toStrictEqual(json);
  });
});
