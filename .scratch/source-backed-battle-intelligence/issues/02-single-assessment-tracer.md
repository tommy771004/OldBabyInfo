# 02 — 單一 Part Assessment tracer

**What to build:** 從一份可重現的來源輸入，到靜態資料與 Part 頁，完整發布一筆可追溯的 Assessment。

**Blocked by:** None — can start immediately

**Status:** done

- [x] Assessment 可附著到一個 Part 或 Combo
- [x] Assessment 支援 Tier、推薦 Combo、打法、重量與 Mold 觀察類型
- [x] 每筆 Assessment 保留 Source Excerpt、Discovery Source、時間與 Attribution Status
- [x] 有 Evidence Source 時可定位原作者及原始 LINE／影片
- [x] 無 Evidence Source 時資料仍可發布並顯示「未附原始來源」
- [x] 同一份輸入重跑不產生重複項目或不穩定排序
- [x] 從來源 fixture 到公開頁面的最高層測試通過

## Evidence

- `src/lib/assessments/schema.ts` validates the five Assessment kinds, Part／Combo subjects, source fields, attribution consistency, and duplicate ids.
- `data/assessments.json` contains a reproducible unattributed tactic fixture with a HackMD Discovery Source and no invented Evidence Source.
- `src/lib/assessments/repository.ts` parses static data and applies deterministic attribution／publishedAt／id ordering.
- `src/lib/assessments/repository.test.ts`, `src/lib/assessments/schema.test.ts`, and `src/components/assessment-tracer.test.tsx` cover the source contract, invalid attribution states, unattributed display, and attributed author／video link display.
- Public HTML verification: `/en/parts/dran-sword` and `/zh-TW/parts/dran-sword` render the Assessment heading, kind, excerpt, captured time, Discovery Source, and「未附原始來源」.
- `npm test -- --run`: 53 files, 264 tests passed; lint, typecheck, build, and `git diff --check` passed.
