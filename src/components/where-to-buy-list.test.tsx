import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { StockListing } from "@/lib/stock/repository.ts";
import { WhereToBuyList } from "./where-to-buy-list.tsx";

const listing: StockListing = {
  id: "funbox-dran-sword",
  partId: "dran-sword",
  productName: "Dran Sword",
  retailer: "Funbox",
  productUrl: "https://example.com/dran-sword",
  price: 1299,
  stockStatus: "in_stock",
  capturedAt: "2026-07-25T12:00:00.000Z",
  lastAttemptAt: "2026-07-25T12:00:00.000Z",
  scrapeStatus: "ok",
};

const labels = {
  price: "Price",
  availability: "Availability",
  inStock: "In stock",
  outOfStock: "Sold out",
  unknownStock: "Availability unknown",
  capturedAt: "Captured",
  stale: "May be out of date",
  visitRetailer: "Open Funbox product page",
  emptyHeading: "No listings yet",
  emptyBody: "This part has not been captured by a retailer yet.",
};

describe("WhereToBuyList", () => {
  it("shows a listing and marks it stale without hiding the retailer link", () => {
    render(
      <WhereToBuyList
        listings={[listing]}
        now="2026-07-26T12:00:00.000Z"
        staleAfterMs={24 * 60 * 60 * 1000}
        labels={labels}
      />,
    );

    expect(screen.getByText("Dran Sword")).toBeInTheDocument();
    expect(screen.getByText("NT$1,299")).toBeInTheDocument();
    expect(screen.getByText("Funbox")).toBeInTheDocument();
    expect(screen.getByText("In stock")).toBeInTheDocument();
    expect(screen.getByText("May be out of date")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Open Funbox product page" })).toHaveAttribute(
      "href",
      listing.productUrl,
    );
  });

  it("explains an empty result instead of rendering an empty list", () => {
    render(<WhereToBuyList listings={[]} now="2026-07-26T12:00:00.000Z" labels={labels} />);

    expect(screen.getByRole("heading", { name: "No listings yet" })).toBeInTheDocument();
    expect(screen.getByText("This part has not been captured by a retailer yet.")).toBeInTheDocument();
  });
});
