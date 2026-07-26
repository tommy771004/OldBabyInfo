# Cross-Generation Parts Catalog

**Status:** ready-for-agent

## Problem Statement

OldBabyInfo currently presents an X-only Part library whose data model assumes every Beyblade is composed of Blade, Ratchet, and Bit. That representation is useful for BEYBLADE X, but it cannot truthfully represent the Original Generation, HMS, Metal Fight, or Burst, because each Generation and System has different replaceable Parts and compatibility rules.

The current library also mixes several distinct concepts:

- a replaceable Part;
- a complete stock Beyblade model;
- an official Release or SKU;
- a regional or color edition;
- equipment such as launchers and stadiums;
- subjective playstyle classifications.

This prevents users from browsing every Generation through one Part library, makes CX subcomponents such as Main Blade, Assist Blade, Lock Chip, Metal Blade, and Over Blade disappear into a generic Blade, and makes retailer products difficult to match without duplicating Parts.

The supplied X sources are not sufficient for earlier Generations. OldBabyInfo needs a source-aware catalog that uses official sources as Field Authorities, licensed community sources as candidate indexes, and Needs Review for facts that cannot yet be verified or safely published.

## Solution

Provide one searchable Parts Catalog organized first by Generation and then by System. The catalog contains complete stock Beyblade models, replaceable Parts, official Releases, and equipment, while preserving their distinct identities and relationships.

Each Generation defines its own valid Part kinds and assembly rules:

- Original Generation includes its Plastic systems and the incompatible HMS system.
- Metal Fight includes Metal, Hybrid Wheel, 4D, and Zero-G or Synchrome systems.
- Burst includes its Takara Tomy and regional Hasbro systems.
- BEYBLADE X includes BX, UX, CX, and later official lines, with CX subcomponents represented independently.

Complete Beyblade models reference their constituent Parts. Releases reference a stock Beyblade model or a bundle of Beyblades, Parts, and equipment. Colorways, regional names, reissues, and retailer listings attach to Releases instead of creating duplicate Parts.

The public catalog only consumes accepted structured facts. Community-sourced or rights-unclear records remain in a separate Needs Review dataset until verified. Source provenance, source version, content hash, region, licensing state, and verification state remain attached to imported facts.

English source identifiers remain stable internal keys. Display names and Alias values preserve official Japanese, Takara English, Hasbro English, Taiwanese Chinese, community abbreviations, and source-specific vocabulary without forcing uncertain translations.

## User Stories

1. As a visitor, I want to choose a Generation before browsing, so that I can focus on the Beyblade system I own.
2. As a visitor, I want to see all four official Generations, so that the library is not limited to BEYBLADE X.
3. As an Original Generation collector, I want Plastic and HMS separated as Systems, so that incompatible Parts are not presented as interchangeable.
4. As a Metal Fight player, I want Metal, Hybrid Wheel, 4D, and Zero-G separated, so that each assembly structure is represented accurately.
5. As a Burst player, I want each Burst System represented, so that Layer subcomponents and regional variants are not flattened.
6. As an X player, I want BX, UX, and CX represented, so that line-specific structures remain understandable.
7. As an X player, I want Main Blade, Assist Blade, Lock Chip, Metal Blade, and Over Blade shown as real replaceable Parts, so that CX configurations are accurate.
8. As a visitor, I want complete stock Beyblades and individual Parts in the same catalog, so that the page deserves to be called a Parts Catalog.
9. As a visitor, I want complete Beyblades visually distinguished from Parts, so that I do not mistake a stock model for a single component.
10. As a visitor, I want to open a complete Beyblade and see its constituent Parts, so that I can understand its stock configuration.
11. As a visitor, I want to open a Part and see which stock Beyblades and Releases contain it, so that I can find how it was originally sold.
12. As a visitor, I want complete Beyblade models separated from Releases, so that recolors and reissues do not duplicate the same mechanical model.
13. As a collector, I want regional Releases recorded separately, so that Takara Tomy and Hasbro products can coexist without overwriting one another.
14. As a Taiwanese buyer, I want Funbox listings matched to the correct Release, so that price and stock are attached to the actual product being sold.
15. As a buyer, I want unmatched retailer listings placed in Needs Review, so that ambiguous product names do not create incorrect catalog entries.
16. As a visitor, I want launchers, stadiums, grips, cases, and other equipment searchable, so that official product bundles are represented completely.
17. As a player, I want equipment excluded from Combo assembly, so that non-Part products cannot enter an illegal Beyblade.
18. As a player, I want assembly compatibility determined by Generation and System, so that incompatible Parts cannot be combined.
19. As a visitor, I want source-specific official names preserved, so that regional terminology does not erase the original identity.
20. As a Taiwanese visitor, I want established Taiwanese names available as Alias values, so that I can search with familiar terminology.
21. As a visitor, I want Hasbro names searchable as Alias values, so that globally used names lead to the correct Takara-oriented record.
22. As a visitor, I want abbreviations searchable, so that short competitive names resolve to the correct Part.
23. As a maintainer, I want stable English internal identifiers, so that changing display terminology does not require data migrations.
24. As a maintainer, I want source versions and hashes retained, so that a changed upstream record can be audited.
25. As a maintainer, I want each source to write only the data family it owns, so that the last scraper to run cannot silently override authoritative facts.
26. As a maintainer, I want official product pages and manuals to decide official SKU and composition facts, so that community summaries do not become official truth.
27. As a maintainer, I want official App-derived data labeled as derived rather than a public official API, so that its authority and extraction risk remain visible.
28. As a maintainer, I want CC BY-SA wiki facts attributed with revision information, so that licensed community data remains traceable.
29. As a maintainer, I want rights-unclear community records isolated in Needs Review, so that the public dataset does not mirror material without permission.
30. As a maintainer, I want only names, taxonomy, relationships, and other minimal facts imported, so that descriptions, images, and full documents are not copied.
31. As a maintainer, I want deterministic adapters for structured sources, so that an LLM is never used where an API or structured page exists.
32. As a maintainer, I want source failures to preserve the last successful snapshot, so that the public catalog does not disappear after an upstream outage.
33. As a maintainer, I want duplicate IDs, empty names, invalid relationships, and unsupported Part kinds rejected before publication, so that broken data cannot build.
34. As a maintainer, I want records with uncertain identity to carry a provisional source key in Needs Review, so that missing data is retained without unsafe merging.
35. As a reviewer, I want to compare accepted and Needs Review records, so that I can promote verified candidates deliberately.
36. As a reviewer, I want source conflicts preserved rather than averaged, so that evidence remains inspectable.
37. As a player, I want official playstyle classifications separated from source-labeled community assessments, so that opinion is not presented as structural truth.
38. As a visitor, I want Generation and System filters to preserve the current locale, so that browsing does not reset my language.
39. As a visitor, I want search to work across Generation, System, complete Beyblade, Part, Release, equipment, and Alias values, so that one search surface covers the catalog.
40. As a visitor, I want the catalog to remain usable on mobile, so that the larger multi-Generation dataset does not make navigation overwhelming.
41. As a returning X user, I want existing X Part details, comparisons, Stats, and Combo behavior to keep working, so that expanding the catalog does not regress current features.
42. As a maintainer, I want the X-specific Stat model retained only where valid, so that older Generations are not assigned invented X Stats.
43. As a maintainer, I want catalog size and client payload measured, so that the static-data architecture can be revisited before multi-Generation growth harms performance.
44. As a visitor, I want provenance shown unobtrusively on catalog details, so that I can tell official, App-derived, community-sourced, and Needs Review information apart.
45. As a maintainer, I want scheduled refreshes to create reviewable diffs, so that data changes remain auditable through git history.
46. As a maintainer, I want the catalog usable through a validated repository interface, so that UI code cannot bypass schema validation.

## Implementation Decisions

- The official top-level Generation taxonomy contains exactly four values: Original Generation, Metal Fight, Burst, and X.
- HMS is a System within the Original Generation, not a fifth official Generation.
- `Generation` and `System` are separate concepts. A Generation groups a toyline era; a System determines Part kinds, assembly structure, and compatibility.
- The domain glossary must be expanded before broad UI migration. The current Blade, Ratchet, Bit, Stat, and Combo definitions remain valid for X but cannot describe every Generation.
- A complete stock Beyblade is a first-class catalog entity distinct from a Part and distinct from a Release.
- A Release represents an official SKU, region, colorway, reissue, or bundle. Multiple Releases may reference the same complete Beyblade model and Parts.
- Equipment is a first-class catalog entity that may be contained in a Release but cannot be used in a Combo.
- Part kinds use stable source-aligned English identifiers internally. Display labels and Alias values are localized separately.
- Unknown or disputed translations remain as source terms until an established localized term exists.
- BEYBLADE X preserves Blade, Ratchet, and Bit as assembly slots and adds source-defined CX subcomponents without flattening them.
- Every Generation or System declares its own allowed assembly structure. X's three-slot Combo contract is not reused for older Generations.
- The existing X Part projection remains available during migration so current Stats, comparison, Meta-related queries, and Combo behavior stay green.
- The migration follows expand–migrate–contract. The cross-Generation catalog is added beside the X-only Part projection, consumers migrate in bounded batches, and obsolete assumptions are removed only after no consumer depends on them.
- Official Takara Tomy history, product pages, Parts pages, manuals, and Hasbro manuals are Field Authorities for official Generation, System, SKU, regional name, and composition facts within their scope.
- BeyBrew MasterData is treated as official App-derived data, not an official public API.
- Fandom Beyblade Wiki is a licensed community candidate source. Its facts retain attribution and revision provenance and do not override official evidence.
- Beywiki is a rights-unclear community candidate source. Its parsed stock combinations remain in Needs Review until rights and factual verification are resolved.
- PlasticsDB and HMSDB may be used for manual verification and discovery, but their text and images are not batch mirrored without permission.
- Wikipedia is a reference for Generation-level cross-checking only, not a Part or SKU Field Authority.
- BeybladeHub, HackMD, and Go-Shoot remain X Discovery Sources and Assessment or Alias inputs; they do not decide official Stats or structural identity.
- Funbox remains the Field Authority for its own Stock Listing facts and may be matched to Releases only when the match is unique.
- Structural data is parsed deterministically. LLM extraction is prohibited for structured JSON, MediaWiki APIs, and stable product markup.
- Every imported source records canonical URL, source kind, source region, source version, retrieval time, content hash, verification status, and license note.
- Accepted and Needs Review snapshots are physically separate. Public repositories load only accepted records.
- Source failure retains the last successful committed snapshot and reports the error; it never replaces valid data with an empty result.
- The public catalog initially remains static repo JSON in accordance with ADR-0001, but client payload and build performance are measured because multi-Generation scale may require reopening that ADR.
- This spec narrows and reopens ADR-0010: BeyBrew remains authoritative for X App-derived fields, but cannot be the Field Authority for Generations it does not cover. Older Generations use official history, product pages, and manuals, with community sources providing candidates.
- This spec also expands the current glossary statement that only X is collected. `Generation` remains the top-level concept, while the X-specific Part and Combo definitions become System-scoped.

## Testing Decisions

- Tests assert external behavior at two seams rather than internal helper structure.
- The Source Adapter seam uses committed fixtures, never live network calls, to prove deterministic extraction, source versioning, classification, relationship building, de-duplication, rights gating, and Needs Review isolation.
- The public Parts Catalog seam renders from the validated static repository and proves that a visitor can choose a Generation, choose a System, distinguish complete Beyblades from Parts and equipment, inspect compositions, and search Alias values.
- Repository validation fails on duplicate IDs, empty names, unknown sources, invalid Part kinds, invalid assembly relationships, and accidental publication of Needs Review records.
- Existing X Part repository, search, comparison, detail, Combo, Stat, and Stock Listing tests are regression prior art and remain green throughout the expand–migrate–contract sequence.
- Existing deterministic import, data-writer, source-permission, and Needs Review tests are prior art for source adapters.
- Parser tests use minimal decision-rich fixtures containing only the markup or JSON required to demonstrate each supported source structure.
- Tests do not snapshot copied source prose, images, or full documents.
- The public-page test is the highest UI seam. Lower component tests are added only when behavior cannot be expressed reliably at that seam.
- Performance verification measures serialized catalog size, server build impact, and the browser payload for the Parts Catalog before the final cutover.

## Out of Scope

- Copying or hosting source images, packaging artwork, product descriptions, full wiki text, or PDF manuals.
- Automatically publishing Beywiki, PlasticsDB, or HMSDB data before rights and factual review.
- Inventing missing Taiwanese Chinese translations.
- Assigning X Stats to Parts from earlier Generations.
- Making Parts from different Generations or incompatible Systems interchangeable.
- Treating community playstyle, Tier, weight observations, or tactics as official structural facts.
- Replacing Event-derived Meta Standing with community opinions.
- Migrating Thread or Stock Listing storage out of the database.
- Building an unrestricted forum or marketplace.
- Completing every regional Hasbro SKU in the first release.
- Replacing the existing Combo and Deck experience for non-X Generations until their legal assembly contracts are separately specified.

## Further Notes

- A working source-snapshot prototype already demonstrates the proposed provenance and rights split. It contains accepted records across all four Generations and a physically separate Needs Review dataset for rights-unclear stock combinations.
- The initial research found no single complete, still-online, officially licensed catalog covering all four Generations. The implementation must remain multi-source by design.
- The largest architectural risk is treating every record as an X Part. The second largest is shipping the entire expanded catalog to every browser route without measuring payload size.
- The glossary requires a follow-up domain-modeling update for complete Beyblade models, Releases, Systems, equipment, and Generation-scoped assembly vocabulary.
