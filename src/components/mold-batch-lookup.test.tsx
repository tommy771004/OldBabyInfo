import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import type { Part } from "@/lib/parts/schema.ts";
import { MoldBatchLookup } from "./mold-batch-lookup.tsx";

const part: Part = {
  id: "dran-sword",
  nameEn: "Dran Sword",
  nameJa: "ドランソード",
  nameZhTw: "赤龍劍",
  aliases: [],
  generation: "X",
  releaseAt: "2023-07-15",
  type: "blade",
  stats: { attack: 55, defense: 0, stamina: 0 },
  modes: [],
  statEditions: [],
  moldBatches: [
    {
      batchCode: "A2",
      note: "Early production run reported a slightly heavier blade.",
      sourceUrl: "https://example.com/dran-sword-batches",
    },
  ],
};

describe("MoldBatchLookup", () => {
  afterEach(cleanup);

  it("shows the linked Part and source when a batch code is found", () => {
    render(
      <MoldBatchLookup
        parts={[part]}
        labels={{
          searchLabel: "Batch code",
          searchButton: "Look up",
          emptyQuery: "Enter a batch code.",
          noMatches: "No recorded batch matches that code.",
          coverage: "Coverage: 1 of 1 Parts, 1 batch entries.",
          source: "Source",
        }}
      />,
    );

    fireEvent.change(screen.getByRole("searchbox", { name: "Batch code" }), {
      target: { value: "A2" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Look up" }));

    expect(screen.getByText("Dran Sword")).toBeInTheDocument();
    expect(screen.getByText("Early production run reported a slightly heavier blade.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Source" })).toHaveAttribute(
      "href",
      "https://example.com/dran-sword-batches",
    );
  });

  it("announces an empty result state to assistive technology", () => {
    render(
      <MoldBatchLookup
        parts={[part]}
        labels={{
          searchLabel: "Batch code",
          searchButton: "Look up",
          emptyQuery: "Enter a batch code.",
          noMatches: "No recorded batch matches that code.",
          coverage: "Coverage: 1 of 1 Parts, 1 batch entries.",
          source: "Source",
        }}
      />,
    );

    fireEvent.change(screen.getByRole("searchbox", { name: "Batch code" }), {
      target: { value: "Z9" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Look up" }));

    expect(screen.getByRole("status")).toHaveTextContent("No recorded batch matches that code.");
  });
});
