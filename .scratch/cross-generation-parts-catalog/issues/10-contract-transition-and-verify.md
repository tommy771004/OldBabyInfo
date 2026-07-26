# 10 — Contract the transition and verify the Catalog

**What to build:** Complete the public transition to the cross-Generation Parts Catalog, remove obsolete transitional assumptions where no consumer remains, document the final domain model and Field Authorities, and verify the whole public journey.

**Blocked by:** 07 — Deliver cross-Generation search and Alias resolution; 08 — Bound the static Catalog payload; 09 — Automate source refresh and review.

**Status:** ready-for-agent

- [ ] The public Parts Catalog uses the cross-Generation repository for Generation browsing, search, complete Beyblades, Parts, Releases, and Equipment.
- [ ] The X-specific Part projection remains only where X Stats, comparison, Combo, or other X-only behavior still requires it.
- [ ] No consumer assumes every Generation uses Blade, Ratchet, and Bit.
- [ ] The domain glossary defines System, complete Beyblade, Release, Equipment, and Generation-scoped assembly vocabulary.
- [ ] Field Authority documentation explicitly covers official history, official product pages and manuals, App-derived X data, licensed community candidates, retailers, and Discovery Sources.
- [ ] ADR-0001 is confirmed or revised using measured static Catalog evidence, and ADR-0010 is revised for non-X Generations.
- [ ] Full lint, typecheck, unit, integration, public-page, and smoke verification passes with zero known errors.
- [ ] The final handoff records remaining coverage gaps for regional Releases without treating them as completed data.
