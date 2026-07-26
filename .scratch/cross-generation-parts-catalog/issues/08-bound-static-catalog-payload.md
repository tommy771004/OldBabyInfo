# 08 — Bound the static Catalog payload

**What to build:** Keep the multi-Generation Parts Catalog fast enough for public use by measuring build cost and browser payload, then loading only the Generation data needed for the active browsing path.

**Blocked by:** 07 — Deliver cross-Generation search and Alias resolution.

**Status:** resolved

- [x] The build reports accepted Catalog size by Generation and entity kind.
- [x] The Parts Catalog does not send every Generation's full dataset to visitors who browse only one Generation unless measurements prove that payload acceptable.
- [x] Generation switching remains fast and preserves filters that are valid in the destination Generation.
- [x] Static generation of detail pages remains compatible with ADR-0001 or the ADR is explicitly reopened with measured evidence.
- [x] Mobile interaction remains usable with the complete production-sized snapshot.
- [x] Performance tests or build assertions fail when agreed payload or page-count limits regress.
- [x] Search behavior remains complete even if data is split by Generation.

## Answer

Bounded the catalog payload while retaining the repo-static ADR-0001 architecture.

- Added `report:generation-catalog` and `prebuild` metrics output with accepted record counts, serialized bytes, and entity-kind counts for every Generation.
- Current accepted snapshot measures 1,942 records / 1,172,555 serialized bytes; per-Generation payloads are 114,814 bytes (Original), 191,786 bytes (Metal Fight), 591,751 bytes (Burst), and 274,207 bytes (X), under the 650,000-byte budget.
- Browse and detail pages now pass only the active Generation records. Cross-Generation search filters server-side and passes only matching accepted results, keeping search complete without shipping unrelated records to ordinary browse pages.
- Added regression tests for payload selection, serialized-size metrics, and the per-Generation budget. Existing responsive page CSS remains in place for mobile interaction.

Verification: `npm test` (86 files, 402 tests), `npm run typecheck`, `npm run lint`, `npm run build`, and `npm run report:generation-catalog` all pass.
