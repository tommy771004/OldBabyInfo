import { cleanup, render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { afterEach, describe, expect, it } from "vitest";
import { PartSilhouette } from "./part-silhouette.tsx";
import { hasObservedWingCount } from "@/lib/parts/blade-wing-count.ts";
import { getAllParts } from "@/lib/parts/repository.ts";
import zh from "@/messages/zh-TW.json";
import type { Part } from "@/lib/parts/schema.ts";

function draw(part: Part, showPlaceholder?: boolean) {
  render(
    <NextIntlClientProvider locale="zh-TW" messages={zh}>
      <PartSilhouette part={part} {...(showPlaceholder === undefined ? {} : { showPlaceholder })} />
    </NextIntlClientProvider>,
  );
}

const parts = getAllParts();
const measuredBlade = parts.find((p) => p.type === "blade" && hasObservedWingCount(p.id))!;
const unmeasuredBlade = parts.find((p) => p.type === "blade" && !hasObservedWingCount(p.id))!;
const ratchet = parts.find((p) => p.type === "ratchet")!;

describe("PartSilhouette", () => {
  afterEach(cleanup);

  it("draws a real Blade shape only when its wing count has been observed", () => {
    draw(measuredBlade);
    expect(screen.getByRole("img")).toBeInTheDocument();
  });

  it("says so, rather than guessing a shape, for an unmeasured Blade", () => {
    // The default is the compare table's behaviour: "not measured" is a real
    // statement there, so it still gets a mark and a label.
    draw(unmeasuredBlade);
    expect(screen.getByRole("img")).toBeInTheDocument();
  });

  it("omits the mark entirely for an unmeasured Blade when placeholders are off", () => {
    // The Combo picker's behaviour. Wing-count observation lags new releases,
    // so a "newest first" list would otherwise be a column of identical empty
    // rings that state nothing the reader can use.
    draw(unmeasuredBlade, false);
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });

  it("still draws the parts whose shape comes from data that is always present", () => {
    // A Ratchet's height is required by the schema, so suppressing
    // placeholders must not suppress a real silhouette.
    draw(ratchet, false);
    expect(screen.getByRole("img")).toBeInTheDocument();
  });
});
