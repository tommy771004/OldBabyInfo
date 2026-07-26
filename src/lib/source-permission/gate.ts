export interface SourceAcquisition {
  source: string;
  method: "automated_mass_fetch" | "manual_import";
  rights: "documented" | "unknown" | "denied";
  capturedAt: string;
  canonicalUrl: string;
}

export type SourceAcquisitionDecision =
  | { status: "allowed"; discoverySource: string; publishFullText: true; retainPreviousDataset: false }
  | { status: "allowed_structured_only"; discoverySource: string; publishFullText: false; retainPreviousDataset: false }
  | { status: "rejected"; reason: string; retainPreviousDataset: true };

export function evaluateSourceAcquisition(input: SourceAcquisition): SourceAcquisitionDecision {
  if (input.method === "automated_mass_fetch" && input.rights !== "documented") {
    return {
      status: "rejected",
      reason: "Automated mass fetching requires explicit compatible permission",
      retainPreviousDataset: true,
    };
  }
  if (input.rights === "denied") {
    return { status: "rejected", reason: "Source rights are denied", retainPreviousDataset: true };
  }
  if (input.rights === "documented") {
    return { status: "allowed", discoverySource: input.source, publishFullText: true, retainPreviousDataset: false };
  }
  return { status: "allowed_structured_only", discoverySource: input.source, publishFullText: false, retainPreviousDataset: false };
}
