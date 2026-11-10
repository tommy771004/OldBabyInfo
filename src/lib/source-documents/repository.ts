import documentsJson from "../../../data/source-documents.json";
import { sourceDocumentsFileSchema, type SourceDocument } from "./schema.ts";
import { loadStaticData } from "../data/static-data.ts";

const documents: SourceDocument[] = loadStaticData(sourceDocumentsFileSchema, documentsJson);

export function getAllSourceDocuments(): SourceDocument[] {
  return documents;
}

export function getSourceDocumentById(id: string): SourceDocument | undefined {
  return documents.find((document) => document.id === id);
}
