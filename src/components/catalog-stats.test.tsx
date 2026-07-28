import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { CatalogStats } from "./catalog-stats.tsx";

const labels = {
  heading: "Computed combo stats",
  attack: "Attack",
  defense: "Defense",
  stamina: "Stamina",
  xDash: "X-Dash",
  burstResistance: "Burst resistance",
  weight: "Weight",
  note: "Computed from its Parts.",
  unavailable: "Stats unavailable.",
};

describe("CatalogStats", () => {
  afterEach(cleanup);

  it("shows every computed value and the assembled weight", () => {
    render(
      <CatalogStats
        stats={{ attack: 80, defense: 40, stamina: 30, xDash: 2, burstResistance: 1 }}
        weightGrams={52.5}
        labels={labels}
      />,
    );

    expect(screen.getByRole("region", { name: labels.heading })).toBeInTheDocument();
    expect(screen.getByText("80")).toBeInTheDocument();
    expect(screen.getByText("52.5 g")).toBeInTheDocument();
    expect(screen.getByText(labels.note)).toBeInTheDocument();
  });

  it("states why numbers are not shown when composition data is incomplete", () => {
    render(<CatalogStats stats={undefined} weightGrams={undefined} labels={labels} />);

    expect(screen.getByText(labels.unavailable)).toBeInTheDocument();
  });
});
