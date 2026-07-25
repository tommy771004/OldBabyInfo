# OldBabyInfo

台灣的 Beyblade X 查詢工具與社群站。核心價值是「準」。

領域語彙見 [`CONTEXT.md`](./CONTEXT.md)；不可逆的設計決策見 [`docs/adr/`](./docs/adr/)。動工前先讀這兩處。

## Agent skills

### Issue tracker

Issues live as markdown files under `.scratch/<feature-slug>/` — the repo is not yet on GitHub. See `docs/agents/issue-tracker.md`.

### Triage labels

The five canonical roles, each label string equal to its name, written as a `Status:` line in the ticket file. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: root `CONTEXT.md` + `docs/adr/`. See `docs/agents/domain.md`.
