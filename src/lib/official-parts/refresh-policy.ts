import type { Part } from "../parts/schema.ts";

/**
 * The exit code the generator uses for this guard alone.
 *
 * The block is the designed outcome, not a malfunction, and the scheduled
 * workflow has to tell the two apart: a run that stops here is the protection
 * working, while any other non-zero exit is a real break that somebody must
 * look at. Sharing exit code 1 for both is what let a month of `npm ci`
 * failures hide behind a workflow that was already red every week.
 */
export const BEYBREW_REFRESH_BLOCKED_EXIT_CODE = 75;

/** Thrown only by the guard below, so callers can recognise the block. */
export class BeybrewRefreshBlockedError extends Error {
  readonly blockedPartCount: number;

  constructor(message: string, blockedPartCount: number) {
    super(message);
    this.name = "BeybrewRefreshBlockedError";
    this.blockedPartCount = blockedPartCount;
  }
}

/**
 * A BeyBrew snapshot is a replacement, not a field-aware merge. Once phstudy
 * owns any published Part fields, replacing the file would undo ADR-0013
 * (including identities that no longer exist in the BeyBrew snapshot).
 *
 * Do not bypass this by scraping phstudy here: automated acquisition has its
 * own rights gate, and its ignored staged files are absent on clean CI clones.
 */
export function assertBeybrewRefreshAllowed(parts: readonly Part[]): void {
  const migrated = parts.filter((part) =>
    part.provenance?.some((entry) => entry.sourceId === "phstudy-beyblade-x"),
  );
  if (migrated.length > 0) {
    throw new BeybrewRefreshBlockedError(
      `BeyBrew-only refresh blocked: ${migrated.length} published Parts have phstudy field authority. ` +
      "No source was loaded and no Parts were replaced. " +
      "Use a reviewed phstudy snapshot with npm run merge:phstudy, then npm run audit:phstudy-bit. " +
      "Automated phstudy acquisition remains subject to the source-policy gate; see ADR-0013 and docs/agents/data-refresh-recovery.md.",
      migrated.length,
    );
  }
}
