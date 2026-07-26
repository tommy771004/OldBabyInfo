# 09 — Automate source refresh and review

**What to build:** Give maintainers a safe refresh workflow that fetches supported sources, produces deterministic accepted and Needs Review diffs, preserves the last successful snapshot on failure, and never publishes rights-unclear candidates automatically.

**Blocked by:** 03 — Deliver the Burst Catalog vertical slice; 04 — Deliver the Metal Fight Catalog vertical slice; 05 — Deliver the Original and HMS Catalog vertical slice; 06 — Connect Releases, Equipment, and Funbox.

**Status:** resolved

- [x] Every supported source records retrieval time, version or revision, content hash, region, rights note, and result counts.
- [x] Structured APIs and stable product markup use deterministic parsing without an LLM.
- [x] A failed or unexpectedly empty source retains the last successful accepted snapshot and emits an actionable error summary.
- [x] Accepted, changed, removed, skipped, and Needs Review records are reported in deterministic order.
- [x] Rights-unclear and conflicting records can only enter the Needs Review output.
- [x] A reviewer can promote a verified candidate without discarding its original provenance.
- [x] Scheduled execution produces a reviewable repository diff and does not write Stock Listing snapshots into the static Catalog.
- [x] Fixture and failure-path tests cover upstream format change, empty response, duplicate identity, source conflict, and safe retry.

## Answer

Added a safe, deterministic catalog refresh seam around the existing source scraper.

- `refreshGenerationCatalog` validates source metadata and records, rejects empty source responses, keeps the previous accepted and Needs Review snapshots on failure, and returns actionable errors.
- Refresh diffs are sorted and include added, changed, removed, skipped, and Needs Review IDs. Duplicate identity conflicts are never published; one deterministic variant is routed to Needs Review.
- `promoteNeedsReviewRecord` requires an explicit verified status and preserves source ID, source record ID, URLs, revisions, and other provenance fields.
- Existing deterministic parser and scraper workflow remains the scheduled entry point via `refresh:generation-catalog`; Stock Listing scraping remains a separate command and data path.
- Fixture tests cover format changes, empty responses, source failure/retry, duplicate identity conflict, rights gating, deterministic diff ordering, and provenance-preserving promotion.

Verification: refresh seam tests pass; full suite remains green after the refresh and payload-boundary changes.
