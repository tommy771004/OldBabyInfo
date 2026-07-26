import { neon } from "@neondatabase/serverless";
import { createSqlThreadReader, type DiscussionRow, type ThreadWithAuthor } from "./sql-repository.ts";
import type { SubjectType } from "./rules.ts";

export interface ThreadReader {
  listVisibleBySubject(subjectType: SubjectType, subjectId: string): Promise<ThreadWithAuthor[]>;
}

export function createNeonThreadReader(connectionString: string): ThreadReader {
  const neonSql = neon(connectionString);
  return createSqlThreadReader({
    async query(text, params = []) {
      const rows = await neonSql.query(text, [...params]);
      return { rows: rows as DiscussionRow[] };
    },
  });
}
