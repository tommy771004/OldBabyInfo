# 05 — Gate phstudy refresh with complete Bit parity audit

**What to build:** Make the complete Bit audit part of the operator-facing manual scrape and refresh journey. Keep automated phstudy refresh disabled while its source policy is `rights: unknown` / `enabled: false`, and make parity a mandatory gate if an explicit Publication Rights decision later enables automation.

**Blocked by:** 03 — Audit Bit battle facts, Modes, and Stat Editions; 04 — Audit Bit release, weight, image, and provenance.

**Status:** ready-for-agent

- [x] The manual operator flow runs the existing scrape before the audit and stops on parity failures with a concise review summary.
- [x] Automated phstudy refresh remains disabled until source policy explicitly permits it.
- [x] If source policy later permits automated refresh, the workflow must run scrape then audit and stop on parity failures.
- [x] Ordinary pull-request tests remain deterministic and do not require phstudy network access.
- [x] Operator documentation explains the local scrape-then-audit command sequence and missing-snapshot failure.
- [x] A successful current audit reports the observed upstream row and usable Bit identity counts without making them permanent hard-coded invariants.
