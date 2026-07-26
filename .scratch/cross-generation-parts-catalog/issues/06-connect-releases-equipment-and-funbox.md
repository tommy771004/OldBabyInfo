# 06 — Connect Releases, Equipment, and Funbox

**What to build:** Let visitors inspect how complete Beyblades, Parts, and Equipment were sold through official Releases, while Taiwanese Funbox Stock Listings attach only to uniquely matched Releases.

**Blocked by:** 02 — Deliver the X Catalog vertical slice.

**Status:** resolved

- [x] A Release can represent an official SKU, region, colorway, reissue, random product, or bundle without duplicating the underlying Part.
- [x] Launchers, stadiums, grips, cases, and other Equipment can belong to a Release but cannot enter a Combo.
- [x] A complete Beyblade may have multiple regional or color Releases that share the same mechanical composition.
- [x] Funbox Stock Listings attach to a Release only when the match is unique and source-backed.
- [x] Ambiguous or unmatched retailer rows enter Needs Review without creating a Release or Part.
- [x] Visitors can move from a Part or complete Beyblade to its Releases and current Stock Listings.
- [x] Fixture tests cover a single-Beyblade Release, a multi-item set, an Equipment-only product, a unique Funbox match, and an ambiguous match.

## Answer

Implemented the Release boundary and connected it to the public catalog, Funbox discovery, and Stock Listing persistence.

- Added deterministic Release and Equipment builders with SKU, region, colorway, reissue, bundle contents, and `comboEligible: false` constraints.
- Official Burst products now emit separate Release records; the refreshed snapshot contains 139 Releases while preserving underlying Beyblade and Part records.
- Funbox discovery attaches only uniquely matched Releases; ambiguous and unmatched rows remain Needs Review, while existing unique Part fallback remains supported.
- Stock Listings now persist `release_id` and can be queried by Release. The catalog browser links Parts and complete Beyblades to containing Releases and exposes Release contents.
- Added fixtures for single-Beyblade, multi-item, Equipment-only, unique, ambiguous, and unmatched cases.

Verification: `npm test` (83 files, 396 tests), `npm run typecheck`, `npm run lint`, and `npm run build` all pass.
