import { describe, expect, it, vi } from "vitest";

const notFound = vi.fn(() => {
  throw new Error("NEXT_NOT_FOUND");
});
const setRequestLocale = vi.fn();

vi.mock("next/navigation", () => ({ notFound }));
vi.mock("next-intl/server", () => ({ setRequestLocale }));

const { requireLocale } = await import("./require-locale.ts");

describe("requireLocale", () => {
  it("passes a supported locale through with the rest of the params", async () => {
    await expect(requireLocale(Promise.resolve({ locale: "ja", slug: "dran-sword" })))
      .resolves.toEqual({ locale: "ja", slug: "dran-sword" });
    expect(setRequestLocale).toHaveBeenCalledWith("ja");
  });

  it("404s instead of rendering a page with a bogus locale", async () => {
    // `/favicon.png` reaches `[locale]/page` as a locale — the middleware
    // matcher skips single segments containing a dot.
    await expect(requireLocale(Promise.resolve({ locale: "favicon.png" }))).rejects.toThrow(
      "NEXT_NOT_FOUND",
    );
    expect(notFound).toHaveBeenCalled();
  });
});
