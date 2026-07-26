import { describe, expect, it } from "vitest";
import { publishSourceDocument, revokeSourceDocument, type SourceDocumentInput } from "./publication.ts";

const input: SourceDocumentInput = {
  id: "licensed-note",
  title: "Licensed note",
  publisher: "Community editor",
  publishedAt: "2026-07-01T00:00:00.000Z",
  capturedAt: "2026-07-26T00:00:00.000Z",
  canonicalUrl: "https://example.com/note",
  licenseName: "CC BY-NC 4.0",
  licenseUrl: "https://creativecommons.org/licenses/by-nc/4.0/",
  permissionEvidence: null,
  content: "A complete licensed source document.",
};

describe("source document publication gate", () => {
  it("publishes complete content when a compatible license is documented", () => {
    const result = publishSourceDocument(input);
    expect(result.status).toBe("published");
    if (result.status === "published") expect(result.document.content).toContain("complete licensed");
  });

  it("rejects full text without rights while leaving structured excerpt handling outside this gate", () => {
    const result = publishSourceDocument({
      ...input,
      licenseName: null,
      licenseUrl: null,
      permissionEvidence: null,
    });
    expect(result).toEqual({ status: "rejected", reason: "Publication Rights are not documented" });
  });

  it("removes a revoked document without touching independently stored assessments", () => {
    expect(revokeSourceDocument([input], "licensed-note")).toEqual([]);
  });
});
