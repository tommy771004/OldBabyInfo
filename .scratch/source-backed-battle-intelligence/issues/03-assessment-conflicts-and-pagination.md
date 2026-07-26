# 03 — Assessment 分歧與 URL 分頁

**What to build:** 使用者能閱讀同一 Subject 的全部來源分歧，並以可分享的 URL 控制頁碼與每頁筆數。

**Blocked by:** 02 — 單一 Part Assessment tracer

**Status:** done

- [x] 衝突 Assessment 並列，不平均、不投票、不合併
- [x] 排序固定為 attributed 優先，再依內容時間由新到舊
- [x] 每頁選項為 5、10、15、20，預設 10
- [x] `assessmentPage` 與 `assessmentSize` 保留重新整理、返回與分享狀態
- [x] 無效、負數或超出範圍的 query 值安全回到有效狀態
- [x] 分頁控制可用鍵盤操作並具有明確名稱
- [x] 測試只依可見順序、URL 與控制行為判斷結果

## Evidence

- `src/lib/assessments/repository.ts` keeps every source entry and sorts attributed entries first, then by `publishedAt` and stable id; no merge or vote is performed.
- `src/lib/assessments/pagination.ts` accepts only 5, 10, 15 and 20, defaults to 10, and safely clamps invalid URL state.
- The Part detail route reads `assessmentPage` and `assessmentSize`, slices the deterministic source list, and emits accessible links that preserve both values in the locale-aware URL.
- `src/lib/assessments/pagination.test.ts` and `src/components/assessment-tracer.test.tsx` cover visible paging state, allowed sizes, invalid values, boundaries and keyboard-operable links.
