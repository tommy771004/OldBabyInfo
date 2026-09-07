import { neon } from "@neondatabase/serverless";
import { createDatabaseAuthAdapter } from "./database-adapter.ts";

export function createNeonAuthAdapter(connectionString: string) {
  const sql = neon(connectionString);
  return createDatabaseAuthAdapter({
    async query(text, params) {
      return { rows: await sql.query(text, [...params]) as Record<string, unknown>[] };
    },
  });
}
