import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { PlaystyleSymbol, RatchetHeightSymbol } from "./type-symbols.tsx";

describe("PlaystyleSymbol", () => {
  it("labels each playstyle in zh-TW", () => {
    render(<PlaystyleSymbol playstyle="attack" locale="zh-TW" />);
    expect(screen.getByRole("img", { name: "攻擊型" })).toBeInTheDocument();
  });

  it("labels each playstyle in ja", () => {
    render(<PlaystyleSymbol playstyle="defense" locale="ja" />);
    expect(screen.getByRole("img", { name: "ディフェンスタイプ" })).toBeInTheDocument();
  });

  it("labels each playstyle in en", () => {
    render(<PlaystyleSymbol playstyle="stamina" locale="en" />);
    expect(screen.getByRole("img", { name: "Stamina type" })).toBeInTheDocument();
  });

  it("renders balance as two crossing lines, not a shared path with the others", () => {
    const { container } = render(<PlaystyleSymbol playstyle="balance" locale="en" />);
    expect(container.querySelectorAll("line")).toHaveLength(2);
    expect(container.querySelectorAll("path")).toHaveLength(0);
  });
});

describe("RatchetHeightSymbol", () => {
  it("labels the height value per locale", () => {
    render(<RatchetHeightSymbol height={70} locale="zh-TW" />);
    expect(screen.getByRole("img", { name: "固定高度 70" })).toBeInTheDocument();
  });

  it("draws the shortest possible bar at the real-world minimum height (50)", () => {
    const { container } = render(<RatchetHeightSymbol height={50} locale="en" />);
    const bar = container.querySelectorAll("line")[1];
    expect(bar?.getAttribute("y1")).toBe("23");
  });

  it("draws the tallest possible bar at the real-world maximum height (85)", () => {
    const { container } = render(<RatchetHeightSymbol height={85} locale="en" />);
    const bar = container.querySelectorAll("line")[1];
    expect(bar?.getAttribute("y1")).toBe("1");
  });

  it("scales the bar proportionally at the midpoint (67.5)", () => {
    const { container } = render(<RatchetHeightSymbol height={67.5} locale="en" />);
    const bar = container.querySelectorAll("line")[1];
    expect(bar?.getAttribute("y1")).toBe("12");
  });

  it("clamps a value above the known real-world range instead of overflowing the gauge", () => {
    const { container } = render(<RatchetHeightSymbol height={999} locale="en" />);
    const bar = container.querySelectorAll("line")[1];
    expect(bar?.getAttribute("y1")).toBe("1");
  });
});
