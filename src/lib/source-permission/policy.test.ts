import { describe, expect, it } from "vitest";
import {
  evaluateCommunityRefreshPolicy,
  type CommunitySourcePolicy,
} from "./policy.ts";

const hackmd: CommunitySourcePolicy = {
  sourceKey: "hackmd-important-record",
  canonicalUrl: "https://hackmd.io/@liangyutw/beyblade-important-record",
  acquisitionMethod: "manual_import",
  rights: "unknown",
  schedule: "none",
  enabled: false,
};

describe("community source refresh policy", () => {
  it("keeps unknown-rights community sources disabled without treating them as an error", () => {
    expect(evaluateCommunityRefreshPolicy([hackmd])).toEqual({
      status: "ready",
      eligibleSources: [],
      reasons: [],
    });
  });

  it("allows a documented automated source to opt into weekly refresh", () => {
    const source: CommunitySourcePolicy = {
      ...hackmd,
      sourceKey: "reviewed-community-feed",
      acquisitionMethod: "automated_mass_fetch",
      rights: "documented",
      schedule: "weekly",
      enabled: true,
    };

    expect(evaluateCommunityRefreshPolicy([source])).toEqual({
      status: "ready",
      eligibleSources: ["reviewed-community-feed"],
      reasons: [],
    });
  });

  it("rejects an enabled weekly source that is not rights-compliant", () => {
    const source: CommunitySourcePolicy = {
      ...hackmd,
      sourceKey: "unsafe-weekly-source",
      acquisitionMethod: "automated_mass_fetch",
      rights: "unknown",
      schedule: "weekly",
      enabled: true,
    };

    expect(evaluateCommunityRefreshPolicy([source])).toMatchObject({
      status: "blocked",
      eligibleSources: [],
      reasons: [
        {
          sourceKey: "unsafe-weekly-source",
          reason: "Weekly automated refresh requires documented compatible permission",
        },
      ],
    });
  });

  it("allows a manually reviewed unknown-rights source only when it remains manual", () => {
    const source: CommunitySourcePolicy = {
      ...hackmd,
      schedule: "manual",
      enabled: true,
    };

    expect(evaluateCommunityRefreshPolicy([source])).toEqual({
      status: "ready",
      eligibleSources: ["hackmd-important-record"],
      reasons: [],
    });
  });
});
