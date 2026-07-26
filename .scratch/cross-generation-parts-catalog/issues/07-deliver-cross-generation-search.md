# 07 — Deliver cross-Generation search and Alias resolution

**What to build:** Give visitors one search surface that finds complete Beyblades, Parts, Releases, and Equipment across Generation, System, official regional names, Taiwanese names, and competitive abbreviations.

**Blocked by:** 03 — Deliver the Burst Catalog vertical slice; 04 — Deliver the Metal Fight Catalog vertical slice; 05 — Deliver the Original and HMS Catalog vertical slice; 06 — Connect Releases, Equipment, and Funbox.

**Status:** resolved

- [x] Search spans all four Generations and every accepted entity kind.
- [x] Results can be narrowed by Generation, System, entity kind, and Part kind without losing the active locale.
- [x] Takara English identifiers remain stable keys while Japanese, Taiwanese Chinese, Hasbro, abbreviation, and community names resolve through Alias.
- [x] Search results visibly distinguish complete Beyblade, Part, Release, and Equipment.
- [x] Needs Review records never appear in public search.
- [x] Existing X search terms and Go-Shoot abbreviations continue to resolve to the same X records.
- [x] Public-page tests cover multilingual Alias hits, filters, empty results, and ambiguous names across different Generations.

## Answer

Implemented the cross-generation catalog search surface and connected it to the localized Parts page.

- Added a public `searchGenerationCatalog` seam that normalizes Unicode, resolves canonical names and aliases, filters accepted records only, and supports Generation, System, entity kind, and Part kind filters.
- Extended the browser with a locale-preserving GET search form covering Beyblade, Part, Release, Equipment, and all catalog filters. A search without a Generation filter searches across all four Generations.
- Kept stable record IDs untouched; Japanese, Taiwanese Chinese, abbreviation, and community aliases are matched without replacing canonical names.
- Added visible entity labels for every result and retained Needs Review exclusion at the search boundary.
- Added red/green fixture coverage for multilingual aliases, cross-Generation ambiguity, filters, empty results, locale-preserving navigation, and X-style abbreviations.

Verification: `npm test` (84 files, 399 tests), `npm run typecheck`, `npm run lint`, and `npm run build` all pass.
