import { describe, expect, it } from "vitest";
import { cleanLocalizedName } from "./clean-localized-name";

describe("cleanLocalizedName", () => {
  it("strips a leading <b>SKU</b> tag and the following space", () => {
    expect(cleanLocalizedName("<b>BX-01</b> 蒼龍神劍")).toBe("蒼龍神劍");
  });

  it("keeps a parenthetical reading — it's real information, not decoration", () => {
    expect(cleanLocalizedName("<b>BX-01</b> F（フラット）")).toBe("F（フラット）");
  });

  it("returns the string unchanged when there is no SKU tag", () => {
    expect(cleanLocalizedName("蒼龍神劍")).toBe("蒼龍神劍");
  });

  it("returns null for the placeholder glyph used when a name is genuinely absent", () => {
    expect(cleanLocalizedName("■")).toBeNull();
  });

  it("returns null for an empty string", () => {
    expect(cleanLocalizedName("")).toBeNull();
  });
});
