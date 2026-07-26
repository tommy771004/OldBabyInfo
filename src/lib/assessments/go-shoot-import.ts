import type { Assessment, AssessmentKind } from "./schema.ts";

const GO_SHOOT_DISCOVERY_SOURCE = {
  kind: "website" as const,
  label: "Go-Shoot X 產品更新資料",
  url: "https://go-shoot.github.io/x/db/-update.json",
};

export interface GoShootAssessmentDraft {
  sourceKey: string;
  subjectType: "part" | "combo";
  subjectId: string;
  kind: AssessmentKind;
  value: string;
  summary: string;
  sourceExcerpt: string;
  publishedAt: string;
  capturedAt: string;
  evidenceSource: Assessment["evidenceSource"];
}

export interface GoShootImportResult {
  assessments: Assessment[];
  needsReview: { sourceKey: string; subjectId: string; reason: "Unknown subject" }[];
}

/**
 * Manual, curated import only. The Go-Shoot page is a Discovery Source; it is
 * never treated as an original author and never overwrites official Part
 * fields. A missing Evidence Source remains explicitly unattributed.
 */
export function importGoShootAssessments(
  drafts: GoShootAssessmentDraft[],
  knownSubjectIds: Set<string>,
): GoShootImportResult {
  const assessments: Assessment[] = [];
  const needsReview: GoShootImportResult["needsReview"] = [];

  for (const draft of drafts) {
    if (!knownSubjectIds.has(draft.subjectId)) {
      needsReview.push({ sourceKey: draft.sourceKey, subjectId: draft.subjectId, reason: "Unknown subject" });
      continue;
    }

    assessments.push({
      id: `assessment:${draft.subjectType}:${draft.subjectId}:${draft.kind}:go-shoot-${draft.sourceKey}`,
      subjectType: draft.subjectType,
      subjectId: draft.subjectId,
      kind: draft.kind,
      value: draft.value,
      summary: draft.summary,
      sourceExcerpt: draft.sourceExcerpt,
      evidenceSource: draft.evidenceSource,
      discoverySource: GO_SHOOT_DISCOVERY_SOURCE,
      attributionStatus: draft.evidenceSource ? "attributed" : "unattributed",
      publishedAt: draft.publishedAt,
      capturedAt: draft.capturedAt,
    });
  }

  return { assessments, needsReview };
}
