import { describe, expect, it } from "vitest";
import { importHackmdAssessments, mergeImportedAssessments, type HackmdAssessmentDraft } from "./hackmd-import.ts";
import type { Assessment } from "./schema.ts";

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

  it("returns an Event lead as a source link without mutating the official Event record", () => {
    const result = importHackmdAssessments(
      [{
        ...base,
        sourceKey: "event-lead",
        eventLead: {
          eventId: "funbox-g3-2026-08-01-1400",
          sourceUrl: "https://docs.google.com/spreadsheets/d/example",
          sourceExcerpt: "8/1 潤泰南港車站店",
        },
      }],
      new Set(["DRANSWORD"]),
      new Set(["funbox-g3-2026-08-01-1400"]),
    );

    expect(result.eventLeads).toEqual([{
      eventId: "funbox-g3-2026-08-01-1400",
      sourceUrl: "https://docs.google.com/spreadsheets/d/example",
      sourceExcerpt: "8/1 潤泰南港車站店",
    }]);
    expect(result.assessments[0]!.subjectId).toBe("DRANSWORD");
  });

  it("retains other source assessments when the HackMD seed is regenerated", () => {
    const other: Assessment = {
      ...resultAssessment(base),
      id: "assessment:part:DRANSWORD:tier:other-source",
      value: "A",
    };
    const imported = resultAssessment(base);
    expect(mergeImportedAssessments([other], [imported])).toHaveLength(2);
  });
});

function resultAssessment(draft: HackmdAssessmentDraft): Assessment {
  return importHackmdAssessments([draft], new Set([draft.subjectId])).assessments[0]!;
}
