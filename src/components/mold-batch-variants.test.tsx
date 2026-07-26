import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { MoldBatch } from "@/lib/mold-batch/lookup.ts";
import { MoldBatchVariants } from "./mold-batch-variants.tsx";

const batch: MoldBatch = {
  batchCode: "A2",
  note: "Early production run reported a slightly heavier blade.",
  sourceUrl: "https://example.com/dran-sword-batches",
};

describe("MoldBatchVariants", () => {
  it("shows known batch differences and their source", () => {
    render(
      <MoldBatchVariants
        batches={[batch]}
        labels={{ heading: "Known mold batches", source: "View source" }}
      />,
    );

    expect(screen.getByRole("heading", { name: "Known mold batches" })).toBeInTheDocument();
    expect(screen.getByText("A2")).toBeInTheDocument();
    expect(screen.getByText("Early production run reported a slightly heavier blade.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "View source" })).toHaveAttribute(
      "href",
      batch.sourceUrl,
    );
  });
});
