import { z } from "zod";

export const sourceDocumentSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  publisher: z.string().min(1),
  publishedAt: z.iso.datetime().nullable(),
  capturedAt: z.iso.datetime(),
  canonicalUrl: z.url(),
  licenseName: z.string().min(1),
  licenseUrl: z.url().nullable(),
  permissionEvidence: z.string().min(1).nullable(),
  content: z.string().min(1),
});

export type SourceDocument = z.infer<typeof sourceDocumentSchema>;

export const sourceDocumentsFileSchema = z.array(sourceDocumentSchema).check((ctx) => {
  const ids = new Set<string>();
  for (const document of ctx.value) {
    if (ids.has(document.id)) {
      ctx.issues.push({ code: "custom", message: `Duplicate source document id: ${document.id}`, input: ctx.value });
      return;
    }
    ids.add(document.id);
  }
});
