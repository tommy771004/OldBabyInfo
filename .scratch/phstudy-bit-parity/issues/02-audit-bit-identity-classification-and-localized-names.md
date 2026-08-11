# 02 — Audit Bit identity, classification, and localized names

**What to build:** Provide one read-only audit command that compares normalized phstudy Bit rows with the Part library and reports whether Field Authority, SKU-to-Part identity collapse, placeholders, classification, localized names, and Aliases are correct.

**Blocked by:** 01 — Restore executable Part data tests.

**Status:** ready-for-agent

- [ ] The audit exposes one public source-to-library report seam and never mutates source or curated data.
- [ ] Rows from all source origins collapse deterministically by usable Bit identity and the documented representative-selection rule.
- [ ] Empty and code-name-less placeholders are reported without becoming Parts or missing-Part failures.
- [ ] The usable upstream identity set exactly matches published `bit` Parts.
- [ ] English, Japanese, Traditional Chinese names and searchable Aliases are verified.
- [ ] Human-readable and machine-readable reports identify mismatching Part ids and fields, and parity errors exit non-zero.
