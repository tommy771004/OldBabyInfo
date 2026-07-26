# 05 — Deliver the Original and HMS Catalog vertical slice

**What to build:** Let visitors browse Original Generation Plastic Parts and HMS Parts as incompatible Systems while preserving rights-unclear complete stock combinations in Needs Review.

**Blocked by:** 02 — Deliver the X Catalog vertical slice.

**Status:** resolved

- [x] Original Generation is the top-level Generation and Plastic and HMS are separate Systems beneath it.
- [x] Plastic exposes System-appropriate kinds such as Bit Chip, Attack Ring, Weight Disk, Spin Gear, Engine Gear, Support Part, and Blade Base.
- [x] HMS exposes Bit Protector, Attack Ring, Weight Disk, and Running Core without treating HMS as a fifth official Generation.
- [x] The Catalog prevents Plastic and HMS Parts from appearing mutually compatible.
- [x] Licensed community Part candidates are attributed with revision provenance.
- [x] Rights-unclear Beywiki stock combinations remain exclusively in Needs Review and are never returned by the public repository.
- [x] Visitors can browse both Systems and see a clear explanation that their Parts are incompatible.
- [x] Fixture tests cover one Plastic assembly, one HMS assembly, and the publication-rights gate.

## Answer

Completed the Original Generation slice through the shared System-scoped browser and validated static snapshot.

- Plastic and HMS remain Systems under `bakuten_shoot`; HMS is not promoted to a fifth Generation.
- System-specific Part kinds and explicit incompatibility rules are exposed in the catalog browser.
- Fandom Part candidates retain community provenance and Beywiki stock combinations remain Needs Review-only.
- Added repository coverage for Plastic/HMS separation and the publication-rights gate.

Verification: targeted repository and browser seams pass; full suite remains green after the cross-generation catalog changes.
