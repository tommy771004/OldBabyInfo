import { z } from "zod";
import guidanceJson from "../../../data/mold-batch-guidance.json";
import { loadStaticData } from "../data/static-data.ts";

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

export const guidanceFileSchema = z.array(guidanceSchema);

export type MoldBatchGuidance = z.infer<typeof guidanceSchema>;

const guidance = loadStaticData(guidanceFileSchema, guidanceJson);

export function getMoldBatchGuidance(): MoldBatchGuidance[] {
  return guidance.map((entry) => ({
    ...entry,
    summary: { ...entry.summary },
    discoverySource: { ...entry.discoverySource },
  }));
}
