# 02 — /parts 每次請求重算靜態索引，related 欄是 N²

Status: done（2026-11-02）

- `withProjectedSearchAliases(...)`、`buildPartNameIndex(getAllParts())`（算兩次）每個請求都重建；改成 module scope。
- `makeRelatedSummary` 對每一列做 `records.filter(...components.some(...))`，約 2,000 筆 × 每列；排序時 `sortValueFor` 每次比較都重算 facts → N log N × N。
- 新增 `src/lib/generation-catalog/relations.ts`（一次建好索引），`relations.test.ts` 用真資料逐筆比對舊的 scan 結果相同、順序相同。
- `makeRowFacts` 每個請求內 memo。

`/parts` 55 → 13 ms；`?sort=attack` 115 → 13 ms。
