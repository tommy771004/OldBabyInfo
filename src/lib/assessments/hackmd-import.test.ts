import { describe, expect, it } from "vitest";
import { importHackmdAssessments, type HackmdAssessmentDraft } from "./hackmd-import.ts";

const base: HackmdAssessmentDraft = {
  sourceKey: "launch-control",
  subjectType: "part",
  subjectId: "DRANSWORD",
  kind: "tactic",
  value: "平射控制",
  summary: "練習平射力道控制。",
  sourceExcerpt: "練習平射力道控制",
  publishedAt: "2026-07-26T00:00:00.000Z",
  capturedAt: "2026-07-26T00:00:00.000Z",
  evidenceSource: null,
};

describe("HackMD assessment import", () => {
  it("keeps HackMD as Discovery Source and publishes an unattributed assessment", () => {
    const result = importHackmdAssessments([base], new Set(["DRANSWORD"]));
    expect(result.needsReview).toEqual([]);
    expect(result.assessments[0]).toMatchObject({
      subjectId: "DRANSWORD",
      attributionStatus: "unattributed",
      evidenceSource: null,
      discoverySource: {
        kind: "website",
        url: "https://hackmd.io/@liangyutw/beyblade-important-record",
      },
    });
  });

  it("retains an explicitly located video or LINE source as Evidence Source", () => {
    const result = importHackmdAssessments(
      [{
        ...base,
        sourceKey: "video-launch-control",
        evidenceSource: {
          kind: "video",
          label: "Launch control",
          author: "Player A",
          url: "https://www.youtube.com/watch?v=example",
        },
      }],
      new Set(["DRANSWORD"]),
    );
    expect(result.assessments[0]!.attributionStatus).toBe("attributed");
    expect(result.assessments[0]!.evidenceSource?.author).toBe("Player A");
  });

  it("routes an unknown Part to Needs Review without publishing it", () => {
    const result = importHackmdAssessments([{ ...base, subjectId: "UNKNOWN" }], new Set(["DRANSWORD"]));
    expect(result.assessments).toEqual([]);
    expect(result.needsReview).toEqual([{ sourceKey: "launch-control", subjectId: "UNKNOWN", reason: "Unknown subject" }]);
  });
});
