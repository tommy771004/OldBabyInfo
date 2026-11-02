# 04 — needs-review JSON 被 runtime repository 載入但沒有頁面使用

Status: done（2026-11-02）

`repository.ts` import 並 zod 驗證 `generation-catalog-needs-review.json`（219 KB），但 `getGenerationCatalogNeedsReview` 只有測試在用。搬到 `src/lib/generation-catalog/needs-review.ts`；scraper 本來就直接讀檔，不受影響。效益不大（約 1 ms + bundle 體積），但沒有理由留在每個 server bundle 裡。
