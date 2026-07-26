import { z } from "zod";
import guidanceJson from "../../../data/mold-batch-guidance.json";

const guidanceSchema = z.strictObject({
  id: z.string().min(1),
  summary: z.strictObject({
    "zh-TW": z.string().min(1),
    en: z.string().min(1),
    ja: z.string().min(1),
  }),
  sourceExcerpt: z.string().min(1),
  discoverySource: z.strictObject({
    kind: z.literal("website"),
    label: z.string().min(1),
    url: z.url(),
  }),
  attributionStatus: z.literal("unattributed"),
  capturedAt: z.iso.datetime({ offset: true }),
});

const guidanceFileSchema = z.array(guidanceSchema);

export type MoldBatchGuidance = z.infer<typeof guidanceSchema>;

const guidance = guidanceFileSchema.parse(guidanceJson);

export function getMoldBatchGuidance(): MoldBatchGuidance[] {
  return guidance.map((entry) => ({
    ...entry,
    summary: { ...entry.summary },
    discoverySource: { ...entry.discoverySource },
  }));
}
