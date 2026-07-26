import { z } from "zod";

export const assessmentKindSchema = z.enum([
  "tier",
  "recommendedCombo",
  "tactic",
  "weight",
  "moldObservation",
]);

const discoverySourceSchema = z.strictObject({
  kind: z.literal("website"),
  label: z.string().min(1),
  url: z.url(),
});

const evidenceSourceSchema = z.strictObject({
  kind: z.enum(["line", "video", "post"]),
  label: z.string().min(1),
  author: z.string().min(1),
  url: z.url(),
});

const assessmentSchemaBase = z.strictObject({
  id: z.string().min(1),
  subjectType: z.enum(["part", "combo"]),
  subjectId: z.string().min(1),
  kind: assessmentKindSchema,
  value: z.string().min(1),
  summary: z.string().min(1),
  sourceExcerpt: z.string().min(1),
  evidenceSource: evidenceSourceSchema.nullable(),
  discoverySource: discoverySourceSchema,
  attributionStatus: z.enum(["attributed", "unattributed"]),
  publishedAt: z.iso.datetime({ offset: true }),
  capturedAt: z.iso.datetime({ offset: true }),
});

export const assessmentSchema = assessmentSchemaBase.check((ctx) => {
  const { attributionStatus, evidenceSource } = ctx.value;
  if (attributionStatus === "attributed" && evidenceSource === null) {
    ctx.issues.push({
      code: "custom",
      message: "An attributed Assessment must have an Evidence Source.",
      input: ctx.value,
    });
  }
  if (attributionStatus === "unattributed" && evidenceSource !== null) {
    ctx.issues.push({
      code: "custom",
      message: "An unattributed Assessment cannot claim an Evidence Source.",
      input: ctx.value,
    });
  }
});

export const assessmentsFileSchema = z.array(assessmentSchema).check((ctx) => {
  const ids = new Set<string>();
  for (const assessment of ctx.value) {
    if (ids.has(assessment.id)) {
      ctx.issues.push({
        code: "custom",
        message: `Duplicate Assessment id: ${assessment.id}`,
        input: ctx.value,
      });
      return;
    }
    ids.add(assessment.id);
  }
});

export type Assessment = z.infer<typeof assessmentSchema>;
export type AssessmentKind = z.infer<typeof assessmentKindSchema>;
