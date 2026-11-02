# 03 — 傳給 client component 的 Part 帶著 provenance

Status: done（2026-11-02）

`provenance` 佔 `parts.json` 約 2/3（134K / 200K），`/`（BattleSearch）、`/combo`（ComboBuilder）、`/parts/compare`（AddPartSearch）把整份 `getAllParts()` 當 prop 傳進 client component，每次渲染都序列化進 RSC payload；沒有任何 client 程式碼讀它。

新增 `getAllPartsForClient()`（`src/lib/parts/repository.ts`）：同一批 Part，provenance 留在伺服器。資料本身不動（ADR-0010），伺服器端渲染的頁面照樣顯示來源。

`/` 387 → 218 KB；`/combo`、`/parts/compare` 279 → 110 KB。
