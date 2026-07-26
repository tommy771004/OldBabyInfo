import { describe, expect, it } from "vitest";
import { getAssessmentsForSubject } from "./repository.ts";

describe("Assessment repository", () => {
  it("publishes a source-labelled assessment for a Part without inventing an Evidence Source", () => {
    const assessments = getAssessmentsForSubject("part", "DRANSWORD");

    expect(assessments).toHaveLength(2);
    expect(assessments[0]).toMatchObject({
      subjectType: "part",
      subjectId: "DRANSWORD",
      kind: "tactic",
      attributionStatus: "unattributed",
      sourceExcerpt: "練習平射、斜射力道控制",
      evidenceSource: null,
      discoverySource: {
        url: "https://hackmd.io/@liangyutw/beyblade-important-record",
      },
    });
    expect(assessments[1]).toMatchObject({
      subjectType: "part",
      subjectId: "DRANSWORD",
      kind: "weight",
      value: "Dran Sword V2: +3g",
      attributionStatus: "unattributed",
      evidenceSource: null,
      discoverySource: {
        url: "https://go-shoot.github.io/x/db/-update.json",
      },
    });
  });
});
