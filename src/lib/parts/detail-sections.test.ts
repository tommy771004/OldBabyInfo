import { describe, expect, it } from "vitest";
import { splitAssessmentsByStage } from "./detail-sections.ts";
import type { Assessment } from "../assessments/schema.ts";

const assessment = (kind: Assessment["kind"]): Assessment => ({
  id: `a-${kind}`,
  subjectType: "part",
  subjectId: "DRANSWORD",
  kind,
  value: kind,
  summary: "summary",
  sourceExcerpt: "excerpt",
  evidenceSource: null,
  discoverySource: { kind: "website", label: "Discovery", url: "https://example.com" },
  attributionStatus: "unattributed",
  publishedAt: "2026-07-26T00:00:00.000Z",
  capturedAt: "2026-07-26T00:00:00.000Z",
});

describe("splitAssessmentsByStage", () => {
  it("keeps strategic judgments in Assessment and physical observations in Mold/weight", () => {
    const result = splitAssessmentsByStage([
      assessment("tier"),
      assessment("recommendedCombo"),
      assessment("tactic"),
      assessment("weight"),
      assessment("moldObservation"),
    ]);

    expect(result.assessment.map((item) => item.kind)).toEqual(["tier", "recommendedCombo", "tactic"]);
    expect(result.physical.map((item) => item.kind)).toEqual(["weight", "moldObservation"]);
  });
});
