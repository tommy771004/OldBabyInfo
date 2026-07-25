import { describe, expect, it } from "vitest";
import { routing } from "./routing";

describe("routing", () => {
  it("serves zh-TW as the default, unprefixed locale", () => {
    expect(routing.defaultLocale).toBe("zh-TW");
  });

  it("supports zh-TW, ja, and en", () => {
    expect(routing.locales).toEqual(["zh-TW", "ja", "en"]);
  });
});
