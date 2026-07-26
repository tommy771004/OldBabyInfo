import type { Assessment } from "../assessments/schema.ts";

const PHYSICAL_KINDS = new Set<Assessment["kind"]>(["weight", "moldObservation"]);

export function splitAssessmentsByStage(assessments: Assessment[]): {
  assessment: Assessment[];
  physical: Assessment[];
} {
  return assessments.reduce(
    (result, item) => {
      (PHYSICAL_KINDS.has(item.kind) ? result.physical : result.assessment).push(item);
      return result;
    },
    { assessment: [], physical: [] } as { assessment: Assessment[]; physical: Assessment[] },
  );
}
