import documentsJson from "../../../data/source-documents.json";
import { sourceDocumentsFileSchema, type SourceDocument } from "./schema.ts";

const documents: SourceDocument[] = sourceDocumentsFileSchema.parse(documentsJson);

export function getAllSourceDocuments(): SourceDocument[] {
  return documents;
}

export function getSourceDocumentById(id: string): SourceDocument | undefined {
  return documents.find((document) => document.id === id);
}
