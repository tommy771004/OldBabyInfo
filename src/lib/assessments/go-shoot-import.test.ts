import { describe, expect, it } from "vitest";
import { importGoShootAssessments, type GoShootAssessmentDraft } from "./go-shoot-import.ts";

const base: GoShootAssessmentDraft = {
  sourceKey: "bxg-49-dran-sword-v2",
  subjectType: "part",
  subjectId: "DRANSWORD",
  kind: "weight",
  value: "Dran Sword V2: +3g",
  summary: "Go-Shoot 的產品更新資料將 BXG-49 的 Dran Sword V2 描述為重量提升 3g；這不是官方 Stat，也不是一般批次碼觀察。",
  sourceExcerpt: "新版本重量提升3g",
  publishedAt: "2026-07-18T18:00:00+08:00",
  capturedAt: "2026-07-26T00:00:00+08:00",
  evidenceSource: null,
};

describe("Go-Shoot assessment import", () => {
  it("keeps a V2 weight observation unattributed and source-labelled", () => {
    const result = importGoShootAssessments([base], new Set(["DRANSWORD"]));

    expect(result.needsReview).toEqual([]);
    expect(result.assessments[0]).toMatchObject({
      id: "assessment:part:DRANSWORD:weight:go-shoot-bxg-49-dran-sword-v2",
      attributionStatus: "unattributed",
      evidenceSource: null,
      discoverySource: {
        kind: "website",
        url: "https://go-shoot.github.io/x/db/-update.json",
      },
    });
  });

  it("routes an unknown Part to Needs Review", () => {
    const result = importGoShootAssessments([{ ...base, subjectId: "UNKNOWN" }], new Set(["DRANSWORD"]));

    expect(result.assessments).toEqual([]);
    expect(result.needsReview).toEqual([
      { sourceKey: "bxg-49-dran-sword-v2", subjectId: "UNKNOWN", reason: "Unknown subject" },
    ]);
  });
});
