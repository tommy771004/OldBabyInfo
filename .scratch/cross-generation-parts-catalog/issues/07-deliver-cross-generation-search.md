# 07 — Deliver cross-Generation search and Alias resolution

**What to build:** Give visitors one search surface that finds complete Beyblades, Parts, Releases, and Equipment across Generation, System, official regional names, Taiwanese names, and competitive abbreviations.

**Blocked by:** 03 — Deliver the Burst Catalog vertical slice; 04 — Deliver the Metal Fight Catalog vertical slice; 05 — Deliver the Original and HMS Catalog vertical slice; 06 — Connect Releases, Equipment, and Funbox.

**Status:** ready-for-agent

- [ ] Search spans all four Generations and every accepted entity kind.
- [ ] Results can be narrowed by Generation, System, entity kind, and Part kind without losing the active locale.
- [ ] Takara English identifiers remain stable keys while Japanese, Taiwanese Chinese, Hasbro, abbreviation, and community names resolve through Alias.
- [ ] Search results visibly distinguish complete Beyblade, Part, Release, and Equipment.
- [ ] Needs Review records never appear in public search.
- [ ] Existing X search terms and Go-Shoot abbreviations continue to resolve to the same X records.
- [ ] Public-page tests cover multilingual Alias hits, filters, empty results, and ambiguous names across different Generations.
