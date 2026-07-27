/**
 * Reads a supplementary panel's data without letting it take the page down.
 *
 * A Part page is a reference page: its Stats, names, images and provenance
 * all come from static JSON in this repo and cannot fail. The discussion
 * threads and shop listings beside them come from Neon, and those *can* —
 * the database sleeps, a connection string is stale, a migration has not run
 * in that environment yet.
 *
 * Before this existed the page only checked whether `DATABASE_URL` was set.
 * With the variable absent (local dev) the page rendered fine; with it set
 * but the query failing (production) the rejection escaped and every
 * `/parts/<slug>` returned a 500 — a whole reference section offline because
 * an optional side panel could not reach a database.
 *
 * The failure is logged rather than swallowed: a panel that is quietly empty
 * forever is its own kind of bug, and this is the only place that would
 * notice.
 */
export async function optionalRead<T>(
  label: string,
  read: () => Promise<T>,
  fallback: T,
): Promise<T> {
  try {
    return await read();
  } catch (error) {
    console.error(`[optional-read] ${label} unavailable, rendering without it:`, error);
    return fallback;
  }
}
