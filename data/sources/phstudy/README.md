# phstudy Beyblade X — staged source snapshot

Raw + normalized capture of <https://beyblade.phstudy.org>, produced by
`scripts/scrape-phstudy-parts.ts` (`npm run scrape:phstudy`).

**This directory is the local snapshot, not the library.** It stays on disk and
git-ignored (see `.gitignore` here). The Bit data and photos have since been
merged into `data/parts.json`, `data/part-images.json` and `public/parts/` —
see [Merged into the Part library](#merged-into-the-part-library) below.

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

## Layout

| Path | Contents |
| --- | --- |
| `raw/*.json` | Byte-verbatim upstream documents, hashed in `manifest.json` |
| `parts-bit.json` | Normalized Bit records (480) |
| `stat-ranges.json` | Per-category stat maxima used for bar scaling |
| `images/Bit/*.png\|jpg` | Part art, filename = part `id` |
| `images/icons/*.png` | Badge assets (type / spin / series / limited) |
| `manifest.json` | Source URLs, `fetchedAt`, per-document sha256, image misses |

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

`scripts/merge-phstudy-parts.ts` (`npm run merge:phstudy`) folds the Bit
snapshot into `data/parts.json`, `data/part-images.json` and `public/parts/`.
Run it after `npm run scrape:phstudy`.

> **重跑 `npm run generate:parts` 會從 beybrew 重建 `parts.json`，蓋掉這裡合併進去的
> 一切。之後必須再跑一次 `npm run merge:phstudy`。**

Conflict rule is owner-decided: **on any field both sources carry, phstudy
wins.** That overrides ADR 0010's field authority (which names BeyBrew
MasterData for X Part names, stats, modes and relationships) for the fields
listed in each Part's phstudy provenance entry. ADR 0010 has not been amended —
the override lives only in the merge script's header.

Two deliberate exceptions:

- `nameZhTw` keeps the Part code, because phstudy's own `name.zh-TW` *is* the
  code (`"CX-11-01 Op"`). The Chinese reading lives in `codeName` and goes to
  `aliases` — the search layer, per ADR 0005.
- A replaced `nameEn` is appended to `aliases`, since the detail URL is
  `slugify(nameEn)`.

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

## Other categories

Only `Bit` images were downloaded. The raw JSON already covers all nine
categories; extend with
`node scripts/scrape-phstudy-parts.ts --category=Blade` or `--all-categories`.
