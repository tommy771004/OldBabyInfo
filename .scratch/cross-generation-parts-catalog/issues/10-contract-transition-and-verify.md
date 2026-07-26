# 10 — Contract the transition and verify the Catalog

**What to build:** Complete the public transition to the cross-Generation Parts Catalog, remove obsolete transitional assumptions where no consumer remains, document the final domain model and Field Authorities, and verify the whole public journey.

**Blocked by:** 07 — Deliver cross-Generation search and Alias resolution; 08 — Bound the static Catalog payload; 09 — Automate source refresh and review.

**Status:** resolved

- [x] The public Parts Catalog uses the cross-Generation repository for Generation browsing, search, complete Beyblades, Parts, Releases, and Equipment.
- [x] The X-specific Part projection remains only where X Stats, comparison, Combo, or other X-only behavior still requires it.
- [x] No consumer assumes every Generation uses Blade, Ratchet, and Bit.
- [x] The domain glossary defines System, complete Beyblade, Release, Equipment, and Generation-scoped assembly vocabulary.
- [x] Field Authority documentation explicitly covers official history, official product pages and manuals, App-derived X data, licensed community candidates, retailers, and Discovery Sources.
- [x] ADR-0001 is confirmed or revised using measured static Catalog evidence, and ADR-0010 is revised for non-X Generations.
- [x] Full lint, typecheck, unit, integration, public-page, and smoke verification passes with zero known errors.
- [x] The final handoff records remaining coverage gaps for regional Releases without treating them as completed data.

## Answer

Completed the cross-Generation transition and documented the final contracts.

- The public `/parts` journey now uses the validated Generation Catalog repository for browse, search, complete Beyblades, Parts, Releases, and Equipment. Existing X Part projection remains for X Stats, comparison, Combo, and legacy Part detail behavior.
- Updated `CONTEXT.md` with Generation, System, Complete Beyblade, Release, Equipment, and Generation-scoped assembly vocabulary.
- Confirmed ADR-0001 with measured payload evidence and revised ADR-0010 with Generation-aware Field Authorities covering official history, product/manual facts, BeyBrew App-derived X data, licensed community candidates, Funbox, and Discovery Sources.
- Regional Release coverage remains incomplete outside the currently captured official Burst releases; no missing regional SKU is presented as complete data. Static Equipment records also remain pending a source match, although the contract and review flow are implemented.

Verification: `npm test` (87 files, 406 tests), `npm run typecheck`, `npm run lint`, `npm run build`, `npm run report:generation-catalog`, and `npm run smoke:public-journey` against the production server all pass.
