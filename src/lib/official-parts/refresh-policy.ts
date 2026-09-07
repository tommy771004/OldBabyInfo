import type { Part } from "../parts/schema.ts";

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
    throw new Error(
      `BeyBrew-only refresh blocked: ${migrated.length} published Parts have phstudy field authority. ` +
      "No source was loaded and no Parts were replaced. " +
      "Use a reviewed phstudy snapshot with npm run merge:phstudy, then npm run audit:phstudy-bit. " +
      "Automated phstudy acquisition remains subject to the source-policy gate; see ADR-0013 and docs/agents/data-refresh-recovery.md.",
    );
  }
}
