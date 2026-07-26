import { sourceDocumentSchema, type SourceDocument } from "./schema.ts";

export type SourceDocumentInput = Omit<SourceDocument, "licenseName" | "licenseUrl" | "permissionEvidence"> & {
  licenseName: string | null;
  licenseUrl: string | null;
  permissionEvidence: string | null;
};

export type PublicationResult =
  | { status: "published"; document: SourceDocument }
  | { status: "rejected"; reason: "Publication Rights are not documented" | "Source Document is invalid" };

/** Full text crosses this boundary only when a license page or explicit
 * permission evidence is recorded. Structured facts and short excerpts are
 * stored by their own repositories and are not blocked by this function. */
export function publishSourceDocument(input: SourceDocumentInput): PublicationResult {
  if (!input.licenseName || (!input.licenseUrl && !input.permissionEvidence)) {
    return { status: "rejected", reason: "Publication Rights are not documented" };
  }

  const result = sourceDocumentSchema.safeParse(input);
  return result.success
    ? { status: "published", document: result.data }
    : { status: "rejected", reason: "Source Document is invalid" };
}

/** Rights withdrawal removes the public document only. Assessment and other
 * structured records live in separate data files and are not mutated here. */
export function revokeSourceDocument<T extends { id: string }>(documents: T[], id: string): T[] {
  return documents.filter((document) => document.id !== id);
}
