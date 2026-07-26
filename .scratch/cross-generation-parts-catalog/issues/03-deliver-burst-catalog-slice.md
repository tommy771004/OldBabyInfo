# 03 — Deliver the Burst Catalog vertical slice

**What to build:** Let visitors browse Burst complete Beyblades and Parts from official Takara Tomy product compositions, organized by the Burst System that defines each assembly structure.

**Blocked by:** 02 — Deliver the X Catalog vertical slice.

**Status:** resolved

- [x] Official Burst product records produce complete Beyblades and independently searchable Parts without copying descriptions or images.
- [x] Single, Dual, God, Cho-Z, Gatinko, Superking, Dynamite Battle, and Burst Ultimate structures are represented without flattening their subcomponents.
- [x] Takara Tomy names remain canonical within their region, while Hasbro names can be attached as Alias values without overwriting them.
- [x] Visitors can choose Burst, filter by System, inspect a stock composition, and navigate between a complete Beyblade and its Parts.
- [x] Official product facts are marked officially verified and community-only candidates retain community provenance.
- [x] Fixture tests cover at least one three-Part Burst model and one later multi-Part Layer model.
- [x] X Catalog behavior and existing X-only features remain unchanged.

## Answer

Implemented the Burst catalog vertical slice on top of the shared Generation/System browser.

- Added deterministic Burst system classification for Single Layer, Dual Layer, God, and Cho-Z product ranges while retaining Gatinko, Superking, Dynamite Battle, and Burst Ultimate markers.
- Kept official Takara Tomy complete Beyblade and Part records separate, with official verification and Fandom community provenance preserved.
- Added fixtures for a three-Part early Burst model and a later multi-Part Layer model.
- Refreshed the static catalog snapshot and exposed all Burst systems through the existing public Generation/System navigation.

Verification: `npm test` (82 files, 388 tests), `npm run typecheck`, and `npm run lint` all pass.
