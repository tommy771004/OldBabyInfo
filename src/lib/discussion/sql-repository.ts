import type { SubjectType, Thread } from "./rules.ts";

export interface DiscussionRow {
  id: string;
  subject_type: SubjectType;
  subject_id: string;
  author_id: string;
  author_name: string;
  body: string;
  created_at: string | Date;
  hidden_at: string | Date | null;
}

export interface DiscussionSqlClient {
  query(text: string, params?: readonly unknown[]): Promise<{ rows: DiscussionRow[] }>;
}

export interface ThreadWithAuthor {
  thread: Thread;
  authorName: string;
}

const LIST_VISIBLE_SQL = `
  SELECT t.id, t.subject_type, t.subject_id, t.author_id, u.display_name AS author_name,
         t.body, t.created_at, t.hidden_at
  FROM threads t
  JOIN app_users u ON u.id = t.author_id
  WHERE t.subject_type = $1
    AND t.subject_id = $2
    AND t.hidden_at IS NULL
    AND t.deleted_at IS NULL
  ORDER BY t.created_at ASC
`;

function iso(value: string | Date): string {
  return value instanceof Date ? value.toISOString() : value;
}

function toThreadWithAuthor(row: DiscussionRow): ThreadWithAuthor {
  return {
    thread: {
      id: row.id,
      subjectType: row.subject_type,
      subjectId: row.subject_id,
      authorId: row.author_id,
      body: row.body,
      createdAt: iso(row.created_at),
      hiddenAt: row.hidden_at === null ? null : iso(row.hidden_at),
    },
    authorName: row.author_name,
  };
}

export function createSqlThreadReader(sql: DiscussionSqlClient) {
  return {
    async listVisibleBySubject(subjectType: SubjectType, subjectId: string): Promise<ThreadWithAuthor[]> {
      const result = await sql.query(LIST_VISIBLE_SQL, [subjectType, subjectId]);
      return result.rows.map(toThreadWithAuthor);
    },
  };
}
