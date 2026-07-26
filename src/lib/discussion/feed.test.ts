import { describe, expect, it } from "vitest";
import { latestThreadsBySubject } from "./feed.ts";
import type { Thread } from "./rules.ts";

const thread = (overrides: Partial<Thread>): Thread => ({
  id: "thread-1",
  subjectType: "part",
  subjectId: "dran-sword",
  authorId: "user-1",
  body: "An observation",
  createdAt: "2026-07-26T12:00:00.000Z",
  hiddenAt: null,
  ...overrides,
});

const subjects = [
  { type: "part" as const, id: "dran-sword", name: "Dran Sword", href: "/parts/dran-sword#discussion" },
  { type: "event" as const, id: "event-1", name: "Taipei G3", href: "/events#event-1" },
];

describe("latestThreadsBySubject", () => {
  it("keeps only the latest visible Thread for each Subject", () => {
    const result = latestThreadsBySubject(
      [
        thread({ id: "old", createdAt: "2026-07-25T12:00:00.000Z" }),
        thread({ id: "new", createdAt: "2026-07-26T13:00:00.000Z" }),
        thread({ subjectType: "event", subjectId: "event-1", id: "event-thread" }),
        thread({ id: "hidden", hiddenAt: "2026-07-26T14:00:00.000Z" }),
      ],
      subjects,
    );

    expect(result.map((item) => item.thread.id)).toEqual(["new", "event-thread"]);
    expect(result[0]?.subject).toEqual(subjects[0]);
  });

  it("filters the feed to one Subject type when requested", () => {
    const result = latestThreadsBySubject(
      [thread({}), thread({ subjectType: "event", subjectId: "event-1", id: "event-thread" })],
      subjects,
      "event",
    );

    expect(result).toHaveLength(1);
    expect(result[0]?.subject.name).toBe("Taipei G3");
  });
});
