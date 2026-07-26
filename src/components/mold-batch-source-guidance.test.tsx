import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { MoldBatchGuidance } from "@/lib/mold-batch/guidance.ts";
import { MoldBatchSourceGuidance } from "./mold-batch-source-guidance.tsx";

const guidance: MoldBatchGuidance = {
  id: "go-shoot-x-general-mold-guidance",
  summary: {
    "zh-TW": "這是一般提示，不是特定 Part 的觀察。",
    en: "General guidance, not a Part-specific observation.",
    ja: "特定Partの観察ではない一般的な案内。",
  },
  sourceExcerpt: "模具變更頗為頻繁（如重量提升）",
  discoverySource: {
    kind: "website",
    label: "Go-Shoot X 資訊站",
    url: "https://go-shoot.github.io/x/",
  },
  attributionStatus: "unattributed",
  capturedAt: "2026-07-26T00:00:00.000Z",
};

describe("MoldBatchSourceGuidance", () => {
  it("publishes general source guidance without presenting it as a Part observation", () => {
    render(
      <MoldBatchSourceGuidance
        guidance={guidance}
        locale="zh-TW"
        labels={{
          heading: "來源提示",
          scope: "這不是特定 Part 的觀察。",
          excerpt: "來源片段",
          discoverySource: "發現來源",
          attribution: "歸屬",
          unattributed: "未附原始來源",
          capturedAt: "抓取時間",
        }}
      />,
    );

    expect(screen.getByRole("heading", { name: "來源提示" })).toBeInTheDocument();
    expect(screen.getByText("這是一般提示，不是特定 Part 的觀察。")).toBeInTheDocument();
    expect(screen.getByText("模具變更頗為頻繁（如重量提升）")).toBeInTheDocument();
    expect(screen.getByText("未附原始來源")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Go-Shoot X 資訊站" })).toHaveAttribute(
      "href",
      "https://go-shoot.github.io/x/",
    );
  });
});
