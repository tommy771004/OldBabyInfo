# 06 — `/parts` 與 `/events` 一次渲染全部列

Status: needs-triage (events 部分)
Type: research
Priority: P3

## 觀察（已確認 2026-09-13，`../probe/shoot.mjs`）

- `/parts`：295 列一次渲染，文件高度 1440px 時 25,377px、390px 時 58,951px。
- `/events`：49 個日期 621 場一次渲染，390px 時 7,608px；沒有「今天」錨點或日期跳轉。

## 要先回答的問題

1. `/parts` 的造訪有多少比例捲到 50% 以上？多少比例帶 `catalogQuery`？（一週 analytics）
2. sitemap 與 `llms.txt` 是否依賴 `/parts` 列出全部 Part？（`src/lib/sitemap-documents.ts`、`src/app/llms.txt/route.ts`）
3. `/events` 讀者是找「最近一場」還是「某一天」？

## 可能方向（不先選）

- `/parts`：預設顯示前 60 筆 + 「顯示更多」；或虛擬捲動；或維持全列但補右側字母／種類跳轉。
- `/events`：頁首固定「今天／本週」錨點；日期 group 用 `<details>` 預設只展開最近 7 天。

推翻條件見 `../spec.md` 測試 D。

## Comments

- 2026-09-13 站方決定：`/parts` 列表直接分頁，每頁 10 / 20 / 50，預設 10，不等 analytics。已實作：`src/lib/pagination.ts`（共用 helper）、`src/lib/generation-catalog/pagination.ts`（`catalogPage` / `catalogSize`）、`src/components/pagination-controls.tsx`（從 AssessmentTracer 抽出的同一組控制項）、`GenerationCatalogBrowser` 在最終可見清單上切片，lede 顯示「第 1–10 筆」。量測：1440 首頁高度 25,377px → 1,817px；`scripts/check-ui-interactions.mjs` 新增三項分頁點擊。測試 D 的「先量再做」改成觀察上線後的翻頁深度即可。`/events` 的「今天」錨點與分組展開仍未決定，票留著。
