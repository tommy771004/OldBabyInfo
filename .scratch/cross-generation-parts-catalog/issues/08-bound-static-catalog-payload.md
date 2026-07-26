# 08 — Bound the static Catalog payload

**What to build:** Keep the multi-Generation Parts Catalog fast enough for public use by measuring build cost and browser payload, then loading only the Generation data needed for the active browsing path.

**Blocked by:** 07 — Deliver cross-Generation search and Alias resolution.

**Status:** ready-for-agent

- [ ] The build reports accepted Catalog size by Generation and entity kind.
- [ ] The Parts Catalog does not send every Generation's full dataset to visitors who browse only one Generation unless measurements prove that payload acceptable.
- [ ] Generation switching remains fast and preserves filters that are valid in the destination Generation.
- [ ] Static generation of detail pages remains compatible with ADR-0001 or the ADR is explicitly reopened with measured evidence.
- [ ] Mobile interaction remains usable with the complete production-sized snapshot.
- [ ] Performance tests or build assertions fail when agreed payload or page-count limits regress.
- [ ] Search behavior remains complete even if data is split by Generation.
