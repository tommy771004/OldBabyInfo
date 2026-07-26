import type { Assessment, AssessmentKind } from "./schema.ts";
import type { EventLead } from "../events/leads.ts";

const HACKMD_DISCOVERY_SOURCE = {
  kind: "website" as const,
  label: "HackMD Beyblade X 重要資料",
  url: "https://hackmd.io/@liangyutw/beyblade-important-record",
};

export interface HackmdAssessmentDraft {
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
  eventLead?: {
    eventId: string;
    sourceUrl: string;
    sourceExcerpt: string;
  };
}

export interface HackmdImportResult {
  assessments: Assessment[];
  eventLeads: EventLead[];
  needsReview: { sourceKey: string; subjectId: string; reason: "Unknown subject" | "Unknown event" }[];
}

/** Imports only curated structured facts and short excerpts. It does not
 * mirror the HackMD document, and it never treats the discovery page as the
 * original author. Subject IDs are supplied by the authoritative repository. */
export function importHackmdAssessments(
  drafts: HackmdAssessmentDraft[],
  knownSubjectIds: Set<string>,
  knownEventIds: Set<string> = new Set(),
): HackmdImportResult {
  const assessments: Assessment[] = [];
  const eventLeads: HackmdImportResult["eventLeads"] = [];
  const needsReview: HackmdImportResult["needsReview"] = [];

  for (const draft of drafts) {
    if (!knownSubjectIds.has(draft.subjectId)) {
      needsReview.push({ sourceKey: draft.sourceKey, subjectId: draft.subjectId, reason: "Unknown subject" });
      continue;
    }

    if (draft.eventLead) {
      if (!knownEventIds.has(draft.eventLead.eventId)) {
        needsReview.push({ sourceKey: draft.sourceKey, subjectId: draft.eventLead.eventId, reason: "Unknown event" });
      } else {
        eventLeads.push(draft.eventLead);
      }
    }

    assessments.push({
      id: `assessment:${draft.subjectType}:${draft.subjectId}:${draft.kind}:hackmd-${draft.sourceKey}`,
      subjectType: draft.subjectType,
      subjectId: draft.subjectId,
      kind: draft.kind,
      value: draft.value,
      summary: draft.summary,
      sourceExcerpt: draft.sourceExcerpt,
      evidenceSource: draft.evidenceSource,
      discoverySource: HACKMD_DISCOVERY_SOURCE,
      attributionStatus: draft.evidenceSource ? "attributed" : "unattributed",
      publishedAt: draft.publishedAt,
      capturedAt: draft.capturedAt,
    });
  }

  return { assessments, eventLeads, needsReview };
}

export function mergeImportedAssessments(previous: Assessment[], incoming: Assessment[]): Assessment[] {
  const byId = new Map(previous.map((assessment) => [assessment.id, assessment]));
  for (const assessment of incoming) byId.set(assessment.id, assessment);
  return [...byId.values()].sort((a, b) => a.id.localeCompare(b.id));
}
