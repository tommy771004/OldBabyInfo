import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import type { ArenaSubject } from "./arena-mark.tsx";
import { PageMasthead } from "./page-masthead.tsx";

const SUBJECTS: ArenaSubject[] = ["field", "ridge", "launch", "exits", "xtreme-line", "duel"];

describe("PageMasthead", () => {
  afterEach(cleanup);

  it("is the page's one level-1 heading, with the lead copy beneath it", () => {
    render(
      <PageMasthead title="賽事行事曆" kicker="CATALOG / X">
        <p>lead</p>
      </PageMasthead>,
    );
    expect(screen.getAllByRole("heading", { level: 1 }).map((h) => h.textContent)).toEqual(["賽事行事曆"]);
    expect(screen.getByText("CATALOG / X")).toBeTruthy();
    expect(screen.getByText("lead")).toBeTruthy();
  });

  it.each(SUBJECTS)("draws the %s mark as decoration that assistive tech skips", (subject) => {
    const { container } = render(<PageMasthead title="t" subject={subject} />);
    const svg = container.querySelector("svg");
    expect(svg?.getAttribute("aria-hidden")).toBe("true");
    // Every line keeps its on-screen weight however small the mark is drawn.
    const strokes = [...svg!.querySelectorAll("path, circle, line")];
    expect(strokes.length).toBeGreaterThan(0);
    expect(strokes.every((node) => node.getAttribute("vector-effect") === "non-scaling-stroke")).toBe(true);
  });

  it("gives each subject its own drawing", () => {
    const drawings = SUBJECTS.map((subject) => {
      const { container } = render(<PageMasthead title="t" subject={subject} />);
      const markup = container.querySelector("svg")!.outerHTML;
      cleanup();
      return markup;
    });
    expect(new Set(drawings).size).toBe(SUBJECTS.length);
  });

  it("leaves the mark out when the page already draws the arena", () => {
    const { container } = render(<PageMasthead title="t" mark={false} />);
    expect(container.querySelector("svg")).toBeNull();
  });
});
