import { describe, expect, it } from "vitest";
import { getMoldBatchGuidance } from "./guidance.ts";

describe("Mold Batch source guidance", () => {
  it("keeps general source guidance separate from Part-specific batch observations", () => {
    const guidance = getMoldBatchGuidance();

    expect(guidance).toHaveLength(1);
    expect(guidance[0]).toMatchObject({
      id: "go-shoot-x-general-mold-guidance",
      attributionStatus: "unattributed",
      discoverySource: {
        url: "https://go-shoot.github.io/x/",
        kind: "website",
      },
    });
    expect(guidance[0]?.summary["zh-TW"]).toContain("不是特定 Part 的觀察");
  });
});
