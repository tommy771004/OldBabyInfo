# 09 — Automate source refresh and review

**What to build:** Give maintainers a safe refresh workflow that fetches supported sources, produces deterministic accepted and Needs Review diffs, preserves the last successful snapshot on failure, and never publishes rights-unclear candidates automatically.

**Blocked by:** 03 — Deliver the Burst Catalog vertical slice; 04 — Deliver the Metal Fight Catalog vertical slice; 05 — Deliver the Original and HMS Catalog vertical slice; 06 — Connect Releases, Equipment, and Funbox.

**Status:** ready-for-agent

- [ ] Every supported source records retrieval time, version or revision, content hash, region, rights note, and result counts.
- [ ] Structured APIs and stable product markup use deterministic parsing without an LLM.
- [ ] A failed or unexpectedly empty source retains the last successful accepted snapshot and emits an actionable error summary.
- [ ] Accepted, changed, removed, skipped, and Needs Review records are reported in deterministic order.
- [ ] Rights-unclear and conflicting records can only enter the Needs Review output.
- [ ] A reviewer can promote a verified candidate without discarding its original provenance.
- [ ] Scheduled execution produces a reviewable repository diff and does not write Stock Listing snapshots into the static Catalog.
- [ ] Fixture and failure-path tests cover upstream format change, empty response, duplicate identity, source conflict, and safe retry.
