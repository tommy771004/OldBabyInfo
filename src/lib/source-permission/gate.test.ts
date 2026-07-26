import { describe, expect, it } from "vitest";
import { evaluateSourceAcquisition, type SourceAcquisition } from "./gate.ts";

const source: SourceAcquisition = {
  source: "BeybladeHub",
  method: "automated_mass_fetch",
  rights: "unknown",
  capturedAt: "2026-07-26T00:00:00.000Z",
  canonicalUrl: "https://beybladehub.app/",
};

describe("source acquisition permission gate", () => {
  it("rejects BeybladeHub automated mass fetching when permission is unknown", () => {
    expect(evaluateSourceAcquisition(source)).toEqual({
      status: "rejected",
      reason: "Automated mass fetching requires explicit compatible permission",
      retainPreviousDataset: true,
    });
  });

  it("allows a manually supplied structured fact while keeping the source as Discovery Source", () => {
    expect(evaluateSourceAcquisition({ ...source, method: "manual_import" })).toMatchObject({
      status: "allowed_structured_only",
      discoverySource: "BeybladeHub",
      publishFullText: false,
    });
  });

  it("allows full text only with documented permission", () => {
    expect(evaluateSourceAcquisition({ ...source, rights: "documented" })).toMatchObject({
      status: "allowed",
      publishFullText: true,
    });
  });

  it("rejects denied rights without changing a previous dataset", () => {
    expect(evaluateSourceAcquisition({ ...source, method: "manual_import", rights: "denied" })).toMatchObject({
      status: "rejected",
      retainPreviousDataset: true,
    });
  });
});
