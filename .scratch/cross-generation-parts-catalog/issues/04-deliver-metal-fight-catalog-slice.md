# 04 — Deliver the Metal Fight Catalog vertical slice

**What to build:** Let visitors browse Metal Fight Parts by Metal, Hybrid Wheel, 4D, and Zero-G or Synchrome Systems, with Takara and Hasbro terminology retained as source-specific names.

**Blocked by:** 02 — Deliver the X Catalog vertical slice.

**Status:** resolved

- [x] Metal, Hybrid Wheel, 4D, and Zero-G or Synchrome appear as distinct Systems under Metal Fight.
- [x] Face, Wheel, Track, Bottom, Clear Wheel, Metal Wheel, 4D components, and Zero-G components use System-appropriate Part kinds.
- [x] Takara and Hasbro regional terms are mapped as source-specific names or Alias values rather than collapsed into one alleged universal official name.
- [x] Licensed community candidates remain identifiable and cannot override facts verified by an official product page or manual.
- [x] Visitors can choose Metal Fight, filter by System and Part kind, and inspect source provenance.
- [x] Ambiguous complete Beyblade compositions remain in Needs Review until officially verified.
- [x] Fixture tests prove regional naming, System separation, and Field Authority conflict handling.

## Answer

Delivered and regression-locked the Metal Fight catalog slice using the existing deterministic Fandom/Beywiki adapters and shared public browser.

- Metal System, Hybrid Wheel, 4D, and Zero-G/Synchrome remain separate System definitions.
- Licensed Fandom candidates stay community-sourced; Beywiki stock compositions remain physically isolated in Needs Review because rights are unclear.
- Source-specific names are preserved at the record boundary and never overwrite an official authority.
- Added repository coverage proving system separation, community provenance, and no accidental publication of rights-unclear Metal Fight Beyblades.

Verification: targeted repository tests pass together with the full suite recorded on tickets 02 and 03.
