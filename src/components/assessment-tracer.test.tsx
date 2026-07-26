import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { Assessment } from "@/lib/assessments/schema.ts";
import { AssessmentTracer } from "./assessment-tracer.tsx";

const assessment: Assessment = {
  id: "assessment:part:DRANSWORD:tactic:hackmd-launch-control",
  subjectType: "part",
  subjectId: "DRANSWORD",
  kind: "tactic",
  value: "平射與斜射控制",
  summary: "來源筆記建議練習平射與斜射力道控制；目前無法定位原始 LINE 或影片，因此不標示原作者。",
  sourceExcerpt: "練習平射、斜射力道控制",
  evidenceSource: null,
  discoverySource: {
    kind: "website",
    label: "HackMD 重要資料",
    url: "https://hackmd.io/@liangyutw/beyblade-important-record",
  },
  attributionStatus: "unattributed",
  publishedAt: "2026-07-26T00:00:00.000Z",
  capturedAt: "2026-07-26T00:00:00.000Z",
};

const attributedAssessment: Assessment = {
  ...assessment,
  id: "assessment:part:DRANSWORD:tactic:line-launch-control",
  attributionStatus: "attributed",
  evidenceSource: {
    kind: "video",
    label: "Launch control video",
    author: "Mina",
    url: "https://www.youtube.com/watch?v=example",
  },
};

describe("AssessmentTracer", () => {
  it("shows an unattributed assessment with its excerpt and discovery source", () => {
    render(
      <AssessmentTracer
        assessments={[assessment]}
        labels={{
          heading: "來源判斷",
          kindLabel: () => "打法",
          unattributed: "未附原始來源",
          excerpt: "來源片段",
          discoverySource: "發現來源",
          evidenceSource: "原始來源",
          capturedAt: "抓取時間",
          pageSize: "每頁筆數",
          pageStatus: (page, totalPages) => `${page}/${totalPages}`,
          previousPage: "上一頁",
          nextPage: "下一頁",
        }}
      />,
    );

    expect(screen.getByRole("heading", { name: "來源判斷" })).toBeInTheDocument();
    expect(screen.getByText("打法")).toBeInTheDocument();
    expect(screen.getByText("平射與斜射控制")).toBeInTheDocument();
    expect(screen.getByText("未附原始來源")).toBeInTheDocument();
    expect(screen.getByText("練習平射、斜射力道控制")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "HackMD 重要資料" })).toHaveAttribute(
      "href",
      "https://hackmd.io/@liangyutw/beyblade-important-record",
    );
  });

  it("shows the original author when an Evidence Source is available", () => {
    render(
      <AssessmentTracer
        assessments={[attributedAssessment]}
        labels={{
          heading: "Source assessments",
          kindLabel: () => "Tactic",
          unattributed: "Original source not attached",
          excerpt: "Source excerpt",
          discoverySource: "Discovery Source",
          evidenceSource: "Evidence Source",
          capturedAt: "Captured",
          pageSize: "Entries per page",
          pageStatus: (page, totalPages) => `${page}/${totalPages}`,
          previousPage: "Previous page",
          nextPage: "Next page",
        }}
      />,
    );

    expect(screen.getByText("Mina")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Launch control video" })).toHaveAttribute(
      "href",
      "https://www.youtube.com/watch?v=example",
    );
  });

  it("exposes keyboard-friendly page-size and next-page links with shareable query state", () => {
    render(
      <AssessmentTracer
        assessments={[assessment]}
        pagination={{ page: 1, pageSize: 5, totalPages: 3, start: 0, end: 5, pathname: "/zh-TW/parts/dransword" }}
        labels={{
          heading: "來源判斷",
          kindLabel: () => "打法",
          unattributed: "未附原始來源",
          excerpt: "來源片段",
          discoverySource: "發現來源",
          evidenceSource: "原始來源",
          capturedAt: "抓取時間",
          pageSize: "每頁筆數",
          pageStatus: (page, totalPages) => `第 ${page} / ${totalPages} 頁`,
          previousPage: "上一頁",
          nextPage: "下一頁",
        }}
      />,
    );

    expect(screen.getByRole("link", { name: "15" })).toHaveAttribute(
      "href",
      "/zh-TW/parts/dransword?assessmentPage=1&assessmentSize=15",
    );
    expect(screen.getByRole("link", { name: "下一頁" })).toHaveAttribute(
      "href",
      "/zh-TW/parts/dransword?assessmentPage=2&assessmentSize=5",
    );
  });
});
