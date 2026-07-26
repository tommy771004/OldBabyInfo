import { describe, expect, it } from "vitest";
import { assessmentSchema } from "./schema.ts";

const baseAssessment = {
  id: "assessment:test",
  subjectType: "part" as const,
  subjectId: "DRANSWORD",
  kind: "tactic" as const,
  value: "Controlled launch",
  summary: "A source-labelled observation.",
  sourceExcerpt: "Launch with control.",
  discoverySource: {
    kind: "website" as const,
    label: "Discovery page",
    url: "https://example.com/discovery",
  },
  publishedAt: "2026-07-26T00:00:00.000Z",
  capturedAt: "2026-07-26T00:00:00.000Z",
};

describe("Assessment schema", () => {
  it("rejects an attributed record that has no Evidence Source", () => {
    const result = assessmentSchema.safeParse({
      ...baseAssessment,
      attributionStatus: "attributed",
      evidenceSource: null,
    });

    expect(result.success).toBe(false);
  });

  it("rejects an unattributed record that claims an Evidence Source", () => {
    const result = assessmentSchema.safeParse({
      ...baseAssessment,
      attributionStatus: "unattributed",
      evidenceSource: {
        kind: "video",
        label: "Launch video",
        author: "Mina",
        url: "https://www.youtube.com/watch?v=example",
      },
    });

    expect(result.success).toBe(false);
  });
});
