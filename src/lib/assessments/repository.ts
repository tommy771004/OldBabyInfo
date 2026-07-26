import assessmentsJson from "../../../data/assessments.json";
import { assessmentsFileSchema, type Assessment } from "./schema.ts";

const assessments = assessmentsFileSchema.parse(assessmentsJson);

function compareAssessments(left: Assessment, right: Assessment): number {
  const attributionOrder = left.attributionStatus === right.attributionStatus
    ? 0
    : left.attributionStatus === "attributed"
      ? -1
      : 1;
  if (attributionOrder !== 0) return attributionOrder;

  const publishedOrder = right.publishedAt.localeCompare(left.publishedAt);
  return publishedOrder !== 0 ? publishedOrder : left.id.localeCompare(right.id);
}

export function getAllAssessments(): Assessment[] {
  return [...assessments].sort(compareAssessments);
}

export function getAssessmentsForSubject(
  subjectType: Assessment["subjectType"],
  subjectId: string,
): Assessment[] {
  return getAllAssessments().filter(
    (assessment) => assessment.subjectType === subjectType && assessment.subjectId === subjectId,
  );
}
