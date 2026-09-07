# Domain Docs

How the engineering skills should consume this repo's domain documentation when exploring the codebase.

This repo is **single-context**: one `CONTEXT.md` at the root, with all ADRs in `docs/adr/`.

## Load on demand, not up front

Don't read `CONTEXT.md` and every ADR at the start of a session. The root
`CLAUDE.md` carries a routing table mapping what you're about to touch to the
specific files that constrain it — read those, and nothing else.

If any of these files don't exist, **proceed silently**. Don't flag their
absence; don't suggest creating them upfront. The `/domain-modeling` skill
(reached via `/grill-with-docs` and `/improve-codebase-architecture`) creates
them lazily when terms or decisions actually get resolved.

## File structure

```
/
├── CLAUDE.md      — the router: always-true rules + what to read for what
├── CONTEXT.md     — the glossary
└── docs/adr/      — one file per irreversible decision
```

## Use the glossary's vocabulary

When your output names a domain concept (in an issue title, a refactor proposal, a hypothesis, a test name), use the term as defined in `CONTEXT.md`. Don't drift to synonyms the glossary explicitly avoids.

In particular: this project says **Combo**, not 配招; **Meta Standing** only for Event-derived statistics; **Part**, not 配件; and **Blade / Ratchet / Bit**, not 上蓋 / 固鎖 / 軸心. Source-labeled Tier or recommendation data is allowed, but it must not be renamed Meta Standing.

If the concept you need isn't in the glossary yet, that's a signal — either you're inventing language the project doesn't use (reconsider) or there's a real gap (note it for `/domain-modeling`).

## Flag ADR conflicts

If your output contradicts an existing ADR, surface it explicitly rather than silently overriding:

> _Contradicts an active ADR — but worth reopening because…_
