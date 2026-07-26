# 07 — 原始 Event 試算表每日更新

**What to build:** 使用者每天都能看到由原始賽事試算表更新的 Event 排程與結果，並可追查每筆資料的來源。

**Blocked by:** None — can start immediately

**Status:** done

- [x] 只由指定原始 Event 試算表決定正式排程與結果欄位
- [x] 每日排程與手動執行產生 added、changed、unchanged 與 failed 報告
- [x] 原始列保留為 Source Excerpt
- [x] 不合理日期、格式破壞與高失敗率會停止發布並進入 Needs Review
- [x] 單次失敗保留最後成功 Event 資料
- [x] Event 頁與 Meta Standing 可讀取更新後資料
- [x] ingestion contract 測試涵蓋新增、變更、未變與錯誤列

## Evidence

- `scripts/ingest-events.ts` only fetches the two approved Google Sheets, runs the daily/manual workflow, validates date bounds and failure rate, and writes only after a successful diff and schema validation. A circuit-breaker failure exits before writing, leaving the last successful `data/events.json` for review.
- `diffAgainstExisting()` now reports `added`, `changed`, `unchanged` and `failed`; each added/changed Event keeps its raw CSV row as top-level `sourceExcerpt`, and a persisted excerpt prevents false changes on rerun.
- `src/app/[locale]/events/page.tsx` reads `getAllEvents()` from the validated repository; Meta Standing remains a separate repository-backed computed surface and does not receive Event schedule fields.
- `src/lib/events/ingest-diff.test.ts`, `src/lib/events/csv-source.test.ts` and `src/lib/events/repository.test.ts` cover source parsing, invalid rows, date checks, diff states, source excerpt retention and repository validation.
