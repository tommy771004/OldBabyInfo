import { z } from "zod";

const sourceKeySchema = z.string().min(1);

export const communitySourcePolicySchema = z.object({
  sourceKey: sourceKeySchema,
  canonicalUrl: z.url(),
  acquisitionMethod: z.enum(["automated_mass_fetch", "manual_import"]),
  rights: z.enum(["documented", "unknown", "denied"]),
  schedule: z.enum(["weekly", "manual", "none"]),
  enabled: z.boolean(),
});

export const communitySourcePoliciesSchema = z.array(communitySourcePolicySchema);

export type CommunitySourcePolicy = z.infer<typeof communitySourcePolicySchema>;

export function isAutomatedCommunityRefreshEligible(
  source: CommunitySourcePolicy | undefined,
): boolean {
  return source?.enabled === true &&
    source.rights === "documented" &&
    source.acquisitionMethod === "automated_mass_fetch" &&
    source.schedule === "weekly";
}

type PolicyReason = { sourceKey: string; reason: string };

export type CommunityRefreshPolicyDecision =
  | { status: "ready"; eligibleSources: string[]; reasons: [] }
  | { status: "blocked"; eligibleSources: string[]; reasons: PolicyReason[] };

function getPolicyReason(source: CommunitySourcePolicy): string | null {
  if (!source.enabled || source.schedule === "none") {
    return "Source refresh is disabled until the acquisition method and rights are documented";
  }
  if (source.rights === "denied") {
    return "Source rights are denied";
  }
  if (source.schedule === "weekly") {
    if (source.acquisitionMethod !== "automated_mass_fetch" || source.rights !== "documented") {
      return "Weekly automated refresh requires documented compatible permission";
    }
    return null;
  }
  if (source.acquisitionMethod !== "manual_import") {
    return "Manual refresh must use a reviewed manual import";
  }
  return null;
}

export function evaluateCommunityRefreshPolicy(
  sources: CommunitySourcePolicy[],
): CommunityRefreshPolicyDecision {
  const eligibleSources: string[] = [];
  const reasons: PolicyReason[] = [];

  for (const source of sources) {
    const reason = getPolicyReason(source);
    if (reason) {
      if (source.enabled || source.schedule !== "none") {
        reasons.push({ sourceKey: source.sourceKey, reason });
      }
      continue;
    }
    eligibleSources.push(source.sourceKey);
  }

  return reasons.length > 0
    ? { status: "blocked", eligibleSources, reasons }
    : { status: "ready", eligibleSources, reasons: [] };
}
