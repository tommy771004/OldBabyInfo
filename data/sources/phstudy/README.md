# phstudy Beyblade X — staged source snapshot

> Current maintenance rule (2026-09-05): BeyBrew-only `generate:parts` /
> `refresh:parts` now refuse to overwrite phstudy-migrated Parts before fetching
> or writing. Merge a reviewed complete snapshot directly into the curated
> library; never rebuild it first. See [refresh recovery](../../../docs/agents/data-refresh-recovery.md)
> and [ADR-0013](../../../docs/adr/0013-blade-identity-follows-phstudy-classification.md).
> Historical counts and Blade-on-hold notes below describe earlier captures,
> not the current migration status. Automated acquisition remains disabled.

Raw + normalized capture of <https://beyblade.phstudy.org>, produced by
`scripts/scrape-phstudy-parts.ts` (`npm run scrape:phstudy`).

**This directory is the local snapshot, not the library.** It stays on disk and
git-ignored (see `.gitignore` here). Bit and Ratchet data plus photos have since
been merged into `data/parts.json`, `data/part-images.json` and `public/parts/`
— see [Merged into the Part library](#merged-into-the-part-library) below.
Blade is deliberately not merged; see [Blade is on hold](#blade-is-on-hold).

Publishing the photos was an owner decision on 2026-08-10, following the
existing go-shoot precedent already in `public/parts/`. Rights remain
`unknown`: the source stays registered in `data/community-source-policy.json`
as `rights: unknown` / `enabled: false`, so `npm run check:community-sources`
still reports no eligible source and no automated refresh can run.

## How it was acquired

`?category=Bit` is a client-side filter — the HTML ships no part markup.
`scripts/viewer.js` loads static JSON from `/data/`, so the scraper reads those
documents directly. No headless browser, no HTML parsing. `robots.txt` is
`Allow: /`; requests run at concurrency 4 with ~150 ms spacing under a
project-identifying User-Agent.

## Operator refresh and parity gate

Run the complete manual review entry point from the repository root:

```sh
npm run refresh:phstudy-bit
```

It runs `npm run scrape:phstudy` first, refreshing the three staged categories
consumed by the merge (Bit, Ratchet, and Blade), then runs the
read-only Bit parity audit with a concise mismatch summary. A failed or incomplete scrape prevents the audit;
an audit mismatch exits nonzero and stops before any merge. The success report
prints the row, group, usable-identity, published-Bit, and placeholder counts
observed in that snapshot; those counts are diagnostic output, not hard-coded
acceptance constants.

The scraper writes staged files incrementally. If it is interrupted or a fetch
fails, treat the snapshot as incomplete and rerun `npm run refresh:phstudy-bit`
from the beginning; do not merge the partially refreshed directory.

To inspect an already-staged snapshot without network access, run
`npm run audit:phstudy-bit` (add `-- --json` for structured output). A fresh
clone normally has no ignored `parts-bit.json`; in that case the command fails
with `Missing phstudy Bit snapshot` and tells the operator to scrape first.
After reviewing intentional drift, run `npm run merge:phstudy` and then rerun
the audit. The refresh command itself never merges or publishes data.

Automated acquisition remains off while `data/community-source-policy.json`
keeps phstudy at `rights: unknown`, `enabled: false`, and `schedule: none`.
The scheduled policy workflow only invokes the same scrape-then-audit command
if a later explicit rights decision makes that exact source eligible; parity
failure stops that job as well. Pull-request CI runs fixture-backed tests only
and never accesses phstudy.

## Layout

| Path | Contents |
| --- | --- |
| `raw/*.json` | Byte-verbatim upstream documents, hashed in `manifest.json` |
| `parts-bit.json` | Normalized Bit records (480) |
| `parts-ratchet.json` | Normalized Ratchet records (465) |
| `parts-blade.json` | Normalized Blade records (483) — staged only, not merged |
| `stat-ranges.json` | Per-category stat maxima used for bar scaling |
| `images/<Category>/*.png\|jpg` | Part art, filename = SKU `id` |
| `images/icons/*.png` | Badge assets (type / spin / series / limited) |
| `manifest.json` | Source URLs, `fetchedAt`, raw and normalized artifact sha256, image misses |

## The catalog is three documents, not one

`viewer.js:1132` merges `main.json` with two hand-authored overlays, first
writer wins: `main.json` → `hardcoded.json` → `hasbro.json` (whose rows are
stamped `brandSource: 'Hasbro'`). Reading `main.json` alone yields 282 Bits and
silently misses 198 the site displays. The extract reproduces the merge and
records `originDocument` and `brandSource` per row.

| Origin | Bits |
| --- | --- |
| `main.json` | 282 |
| `hasbro.json` | 163 |
| `hardcoded.json` | 35 |
| **total** | **480** |

`hasbro.json` also carries one blank-keyed placeholder row; it is dropped.
Rows are validated individually — a malformed row is counted and skipped, never
allowed to discard its whole document.

## Images

The scraper walks the same three candidates the page falls back through and
records which one answered in `image.variant`:

1. `images/site/<Folder>/<id>.png`
2. `images/site/<Folder>/<id>.jpg`
3. `images/app/<Folder>/<id>.png`

Current run: 469 of 480 items have art (447 `site-png`, 22 `app-png`). The 11
misses 404 on every candidate and are listed in `manifest.json`.

`viewer.js:1500` hides `R`-suffixed ids from its own listing, but their art is
still served — 12 of the 16 resolve fine. Those rows are kept and flagged
`hiddenUpstream: true` rather than dropped.

## Merged into the Part library

`scripts/merge-phstudy-parts.ts` (`npm run merge:phstudy`) folds the Bit,
Ratchet and Blade snapshots into `data/parts.json`, `data/part-images.json` and
`public/parts/`. Run it after `npm run scrape:phstudy`. It is idempotent —
re-running on already-merged data is a no-op.

Junk filtering is per category and schema-aligned: a Bit with no code name has
no display name or URL slug (upstream ships a blank-id row and a `"■"` row); a
Ratchet with `height <= 0` is an upstream placeholder (`RATCHET-integrated`,
`ラチェット一体型ブレード`, and single letters `D`/`O`/`P`/`V`, all with all-zero
stats), and `ratchetSchema` requires a positive height anyway.

### Stat Editions, not coin flips

A group can carry more than one stat tuple across its SKUs. The `2-60` Ratchet
ships both `16/8/6` (earliest SKU) and `10/13/7` (10 of its 14 SKUs, and the
curated value). The merge keeps the curated tuple as canonical **whenever it
still appears upstream** — 以新的資料為準 decides between *sources*, not between
SKUs of one Part — and records every other tuple as a `statEdition` labelled by
`model_name`, matching what `build-stat-editions.ts` produces for beybrew.
Result: zero stat values changed across the whole library.

A tuple that is a Bit's mode is never also recorded as an edition — different
mechanics (ADR-0007). That is why `Tr` lost its old beybrew edition: the tuple
is now its Attack Mode.

> **舊版 BeyBrew 重建流程會覆寫遷移資料；目前已加入 fail-closed 保護。
> 請直接將已審查的完整快照合併到現有策展資料，不要先重建。**

Conflict rule is owner-decided: **on any field both sources carry, phstudy
wins.** That overrides ADR 0010's field authority (which names BeyBrew
MasterData for X Part names, stats, modes and relationships) for the fields
listed in each Part's phstudy provenance entry. ADR 0010 has not been amended —
the override lives only in the merge script's header.

Each normalized `parts-*.json` artifact is hashed in `manifest.json` after it
is written. Capture time lives only on the manifest, not in every normalized
row, so identical upstream bytes produce an identical normalized hash on
consecutive refreshes. Part provenance that covers the mixed Bit projection points to the
`parts-bit.json` hash and uses `community_source`: the normalized row combines
official-App rows with phstudy's code-name and weight tables, so claiming the
whole projection as `official_app_derived` would overstate the weight and name
authority. Before changing the library, the merge recomputes the Bit snapshot's
byte count and SHA-256 and rejects a stale or duplicate manifest claim. The
read-only audit independently recomputes every raw and normalized file hash
before trusting that provenance link.

### Localized names

Bits are now localized the way Blades already were — one name per locale via
`localizedNameOf`, sourced from `part_code_names.json`:

| Field | Value | Shown in |
| --- | --- | --- |
| `nameEn` | `Gear Flat` | `/en` |
| `nameJa` | `GF（ギアフラット）` | `/ja` |
| `nameZhTw` | `GF 齒輪平坦` | `/` (zh-TW) |

Code + reading, so a combo written `3-60GF` still reads off a list that shows
only the name. Coverage is 52/52 Bits in both zh-TW and ja.

This is **not** phstudy's `name.zh-TW` field — that one is the SKU label
(`"CX-11-01 Op"`). The readings come from `part_code_names.json`, and each bare
reading (`齒輪平坦`, `ギアフラット`) also goes to `aliases` so searching it alone
matches, per ADR 0005.

Ratchets and Blades are untouched: upstream carries code names for Bit,
AssistBlade and OverBlade only, and the latter two are CX Part kinds that live
in the Generation Catalog rather than `parts.json`.

### Superseded values are cleaned, not accumulated

phstudy is the naming authority for Bits, so the merge **derives** rather than
appends:

- **`aliases` are rebuilt from the source** each run — code + ja reading + zh
  reading. A superseded name does not linger: `DB` dropped `"Disc Ball"` when it
  became `Disk Ball`, and `Y` dropped `"Yield"`. Trade-off: a hand-added alias
  on a Bit is wiped on the next merge.
- **Older provenance entries withdraw the fields phstudy took over.** A `fields`
  list records which source supplied the value now stored, so once phstudy's
  value wins, the earlier claim is removed; an entry left claiming nothing is
  dropped entirely. beybrew now keeps only what it still supplies — `modes`
  (except on `Op`/`Tr`, where phstudy supplies those too) and `id` /
  `statEditions`.

Renaming `nameEn` moves the detail URL, since it is `slugify(nameEn)`:
`/parts/disc-ball` → `/parts/disk-ball`, `/parts/yield` → `/parts/yielding`.
Nothing in the repo links to the old paths and no redirects are configured; the
Catalog↔Part crosswalk matches on the Part code, not the English name, so it is
unaffected (168 matches before and after).

## Repo rules this touches

- **ADR 0011 (publication rights) — partially overridden.** The 52 Bit photos
  are now published under `public/parts/`, by the owner decision noted at the
  top; rights are still undocumented. The prose `description` fields are *not*
  published — they stay in this git-ignored snapshot, and only structured
  facts (names, stats, dates, weights) crossed into the library.
- **ADR 0010 (field authority) — overridden for the merged fields.** The ADR
  names BeyBrew MasterData as the authority for X Part names, stats, modes and
  relationships. The 「以新的資料為準」 directive supersedes it for the fields
  each Part's phstudy provenance entry lists. The ADR itself is unamended; the
  repo files authority changes as migrations, so this is worth an ADR amendment.
- **Granularity differs.** Upstream is per-SKU (480 Bits ≈ 53 real `groupId`s —
  colour and set variants of the same part). `data/parts.json` is
  per-part-identity, so the merge collapses each `groupId` to one Part, picking
  a representative SKU (Takara Tomy rows before Hasbro, lowest collection order).
- **Absence is not new data.** Where phstudy carries no usable value, the
  curated one stands — `releaseAt` in particular is never erased to null.
  `data/phstudy-bit-curated-baseline.json` records the pre-phstudy release dates
  so the audit can detect an accidental erasure independently of the current
  `parts.json` value.

## Blade: identity moved to phstudy (ADR 0013)

The two sources disagreed on what a Blade *is*. `parts.json` mixed CX
`MainBlade` parts into its Blade set and identified them by beybrew short names
(`ARC`, `BRAVE`); phstudy files those under `BeybladePartsMainBlade` and keeps
Blade for whole blades (`DRANARC`, `HELLSREAPER`). [ADR 0013](../../../docs/adr/0013-blade-identity-follows-phstudy-classification.md)
settles it in phstudy's favour.

- **17 CX MainBlades left `parts.json`** — the Generation Catalog already
  carried all 17 as accepted `main_blade` records, so nothing was lost. Their
  detail URLs are gone and the x-crosswalk drops 168 → 151 matches, which is the
  behaviour `repository.test.ts` already asserts for CX parts.
- **Blade 84 → 103**, total 191 Parts. **No existing Blade URL changed**: the
  curated `nameEn` is kept, and the URL is `slugify(nameEn)`, not the id.
- **Every address this work broke now 308s.** The merge emits
  `data/legacy-part-redirects.json` — 17 evicted MainBlades point at their
  Catalog record, `/parts/disc-ball` and `/parts/yield` at their new slugs — and
  `next.config.ts` expands each into unprefixed, `/ja` and `/en` forms. The
  script throws if a redirect source still resolves to a live Part.
- **36 new Blades** named by vocabulary segmentation of the `group_id`, since
  phstudy has no `part_code_names.json` for Blades and ADR 0007 forbids deriving
  display names from SKU labels. Unsegmentable ids are reported, never guessed.
- **ja / zh names come straight from phstudy** once the SKU code, colorway and
  trailing slot letter are stripped — they match the curated values exactly
  where both exist.

Upstream classification defects are enumerated in
`scripts/phstudy-blade-vocabulary.ts`, never inferred: two blades split across
two `group_id`s each (`WARRIORSABER`/`SAMURAISABER`,
`HELLSHUMMER`/`HELLSHAMMER` — caught because each pair shares one katakana
name), a mislabelled single-SKU group (`BEYBLADEBURST` = Storm Spriggan), two
ids with a stray trailing slot letter, a `BIT` group holding Bit sets, and 81
ungrouped SKUs that are Hasbro licensed collabs rather than part identities.

## Other categories

Bit, Ratchet and Blade are merged. The remaining upstream categories (Series,
MainBlade, AssistBlade, LockChip, MetalBlade, OverBlade) are CX/product-level
kinds that belong to the Generation Catalog, not `parts.json`. Their raw JSON is
already staged — extend with `node scripts/scrape-phstudy-parts.ts --all-categories`.
