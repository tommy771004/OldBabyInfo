export function evaluateScrapeHealth(resultCount: number, expectedCount: number) {
  if (resultCount < expectedCount) {
    return {
      ok: false,
      message: `Only ${resultCount} of the expected ${expectedCount} targets were scraped.`,
    };
  }
  return { ok: true, message: `${resultCount} targets scraped.` };
}
