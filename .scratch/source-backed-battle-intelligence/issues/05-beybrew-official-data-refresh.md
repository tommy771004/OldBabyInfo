# 05 — BeyBrew 官方資料更新

**What to build:** 維護者可每週或手動更新官方 Part 名稱、Stat、Mode 與關係，使用者看到的官方資料始終來自指定 Field Authority。

**Blocked by:** None — can start immediately

**Status:** done

- [x] 匯入只讀取 MasterData 中的結構化官方事實與來源版本
- [x] 未授權的程式碼、全文與圖像不被複製進資料集
- [x] 官方值變更產生可審查的 deterministic diff
- [x] 非 Field Authority 的來源不能覆蓋官方名稱、Stat、Mode 或 Part 關係
- [x] 更新支援每週排程與手動觸發
- [x] 失敗時保留最後成功資料並輸出錯誤摘要
- [x] 來源 fixture 到 Part repository 的 ingestion contract 測試通過

## Evidence

- `src/lib/official-parts/refresh.ts` is the public ingestion contract: it validates Part-shaped structured data, sorts by stable id, emits added／changed／removed ids, and retains the previous Parts on loader failure.
- `src/lib/official-parts/refresh.test.ts` covers deterministic diffs, failure retention, stable ordering, source version, and stripping non-Part payload fields.
- `scripts/generate-parts-seed.ts` now publishes through the contract and writes `data/parts.json` only after a successful validated refresh; unchanged input is not rewritten.
- `package.json` exposes `refresh:parts` for manual runs.
- `.github/workflows/official-parts-refresh.yml` provides a weekly schedule and `workflow_dispatch`, then opens a review PR for deterministic changes.
- The generator only maps structured BeyBrew `beyparts.json` / `MasterData.json` fields into the existing Part schema; no source code, full text, or images are written.
- `npm test -- --run`: 54 files, 267 tests passed; lint, typecheck, build, and `git diff --check` passed.
