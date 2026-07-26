import { describe, expect, it } from "vitest";
import { slugify } from "./slug.ts";

describe("slugify", () => {
  it("lowercases and hyphenates a two-word name", () => {
    expect(slugify("Scorpio Spear")).toBe("scorpio-spear");
  });

  it("collapses punctuation into a single hyphen", () => {
    expect(slugify("Lightning L-Drago")).toBe("lightning-l-drago");
  });

  it("leaves a one-word camelCase name lowercased with no internal hyphen", () => {
    expect(slugify("HellsHammer")).toBe("hellshammer");
  });

  it("trims leading and trailing hyphens", () => {
    expect(slugify("-Delta-")).toBe("delta");
  });
});
