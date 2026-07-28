import { describe, expect, it } from "vitest";
import { createSqlThreadReader, type DiscussionSqlClient } from "./sql-repository.ts";

describe("createSqlThreadReader", () => {
  it("returns only visible Threads anchored to the requested Subject", async () => {
    const sql: DiscussionSqlClient = {
      async query(text, params) {
        expect(text).toContain("hidden_at IS NULL");
        expect(params).toEqual(["part", "dran-sword"]);
        return {
          rows: [
            {
              id: "thread-1",
              subject_type: "part",
              subject_id: "dran-sword",
              author_id: "user-1",
              author_name: "Mina",
              body: "A useful observation",
              created_at: "2026-07-26T12:00:00.000Z",
              hidden_at: null,
            },
          ],
        };
      },
    };

    await expect(createSqlThreadReader(sql).listVisibleBySubject("part", "dran-sword")).resolves.toEqual([
      {
        thread: {
          id: "thread-1",
          subjectType: "part",
          subjectId: "dran-sword",
          authorId: "user-1",
          body: "A useful observation",
          createdAt: "2026-07-26T12:00:00.000Z",
          hiddenAt: null,
        },
        authorName: "Mina",
      },
    ]);
  });

  it("lists all visible Threads for the subject-oriented feed", async () => {
    const sql: DiscussionSqlClient = {
      async query(text, params) {
        expect(text).toContain("ORDER BY t.created_at DESC");
        expect(params).toBeUndefined();
        return {
          rows: [{
            id: "thread-2",
            subject_type: "event",
            subject_id: "event-1",
            author_id: "user-2",
            author_name: "Kai",
            body: "Event note",
            created_at: "2026-07-26T13:00:00.000Z",
            hidden_at: null,
          }],
        };
      },
    };

    await expect(createSqlThreadReader(sql).listVisible()).resolves.toMatchObject([{
      thread: { id: "thread-2", subjectType: "event", subjectId: "event-1" },
      authorName: "Kai",
    }]);
  });
});
