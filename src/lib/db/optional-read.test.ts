import { afterEach, describe, expect, it, vi } from "vitest";
import { optionalRead } from "./optional-read.ts";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("optionalRead", () => {
  it("returns what the read returned when it works", async () => {
    await expect(optionalRead("threads", async () => [1, 2], [])).resolves.toEqual([1, 2]);
  });

  it("falls back instead of letting the page fail", async () => {
    // This is the production incident: DATABASE_URL was set, the query threw,
    // and every /parts/<slug> returned a 500 because an optional side panel
    // could not reach Neon.
    vi.spyOn(console, "error").mockImplementation(() => {});

    await expect(
      optionalRead("threads", async () => { throw new Error("connection refused"); }, []),
    ).resolves.toEqual([]);
  });

  it("logs the failure rather than hiding it", async () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});

    await optionalRead("stock listings", async () => { throw new Error("relation does not exist"); }, []);

    expect(error).toHaveBeenCalledOnce();
    expect(String(error.mock.calls[0]?.[0])).toContain("stock listings");
  });

  it("passes a synchronous throw through the same path", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});

    await expect(
      optionalRead("threads", () => { throw new Error("bad connection string"); }, "none"),
    ).resolves.toBe("none");
  });
});
