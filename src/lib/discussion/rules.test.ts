import { describe, expect, it } from "vitest";
import {
  canDeleteThread,
  canPostThread,
  parseThreadBody,
  type Thread,
} from "./rules.ts";

const thread: Thread = {
  id: "thread-1",
  subjectType: "part",
  subjectId: "dran-sword",
  authorId: "user-1",
  body: "This batch feels different in play.",
  createdAt: "2026-07-26T12:00:00.000Z",
  hiddenAt: null,
};

describe("discussion rules", () => {
  it("accepts useful body text and rejects blank or overlong posts", () => {
    expect(parseThreadBody("  A useful observation.  ")).toBe("A useful observation.");
    expect(() => parseThreadBody("   ")).toThrow("empty");
    expect(() => parseThreadBody("x".repeat(2001))).toThrow("2000");
  });

  it("allows only the author to delete a visible Thread", () => {
    expect(canDeleteThread(thread, "user-1")).toBe(true);
    expect(canDeleteThread(thread, "user-2")).toBe(false);
    expect(canDeleteThread({ ...thread, hiddenAt: "2026-07-26T13:00:00.000Z" }, "user-1")).toBe(false);
  });

  it("blocks rapid repeat posts by the same author", () => {
    expect(
      canPostThread(
        [thread],
        "user-1",
        "2026-07-26T12:00:30.000Z",
        60_000,
      ),
    ).toEqual({ allowed: false, reason: "Please wait before posting again." });
    expect(
      canPostThread(
        [thread],
        "user-1",
        "2026-07-26T12:01:00.000Z",
        60_000,
      ),
    ).toEqual({ allowed: true });
  });
});
