# 01 — Expand the cross-Generation Catalog contract

**What to build:** Add the cross-Generation Catalog beside the existing X-only Part projection so maintainers can validate Generation, System, complete Beyblade, Part, Release, Equipment, provenance, and Needs Review records without changing current public behavior.

**Blocked by:** None — can start immediately.

**Status:** resolved

- [x] The accepted static snapshot validates all four official Generations and rejects duplicate IDs, empty names, unknown sources, and invalid entity relationships.
- [x] The Needs Review snapshot is physically separate and cannot be returned by the public Catalog repository.
- [x] Complete Beyblade, Part, Release, and Equipment are distinct entity kinds with stable source-aligned identifiers.
- [x] Each record retains source kind, region, version, content hash, rights state, and verification state.
- [x] Generation and System remain separate, and each System can declare its own Part kinds and compatibility rules.
- [x] Existing X Part, Stat, comparison, Combo, and Stock Listing behavior remains unchanged.
- [x] Deterministic fixture tests cover the source Adapter seam without live network calls.

## Answer

Implemented the expand-side catalog contract with fixture-first tests.

- Extended the schema to support `beyblade`, `part`, `release`, and `equipment` entities.
- Added independent Generation/System definitions, including X CX subcomponent kinds and compatibility rules.
- Added relationship validation for component and Release-to-Beyblade references, duplicate IDs, unknown sources/generations/systems, and source-generation mismatches.
- Kept accepted and Needs Review snapshots physically separate; uncertain Needs Review system labels remain isolated from accepted-system validation.
- Added deterministic schema fixtures and repository regression coverage while preserving the existing X projection.
- Updated both committed snapshots and the scraper so System definitions survive refreshes.

Verification: `npm test` (81 files, 382 tests), `npm run typecheck`, `npm run lint`, and `git diff --check` all pass.
