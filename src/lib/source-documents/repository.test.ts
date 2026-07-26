import { describe, expect, it } from "vitest";
import { getAllSourceDocuments, getSourceDocumentById } from "./repository.ts";

describe("source document repository", () => {
  it("starts empty rather than inventing a licensed full-text mirror", () => {
    expect(getAllSourceDocuments()).toEqual([]);
    expect(getSourceDocumentById("unknown")).toBeUndefined();
  });
});
