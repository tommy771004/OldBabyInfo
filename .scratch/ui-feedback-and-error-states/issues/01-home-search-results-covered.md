# 01 — 首頁搜尋結果清單被競技場文案層蓋住，滑鼠點不到

Status: ready-for-agent
Type: task
Priority: P0

## 觀察（已確認 2026-09-13，`../probe/stack.mjs`、`../probe/click.mjs`、`../probe/verify.mjs`）

- `src/components/battle-search.module.css`：`.results` 是 `position: absolute; z-index: 4`，祖先 `.searchHeader` 是 `position: relative; z-index: 2`（第 25–28 行），形成 stacking context；`.analysisCopy` 同為 `z-index: 2`（第 307–318 行）且在 DOM 較後，整個 listbox 被畫在它下面。
- 1440px：輸入 `dran` 後 6 筆 `[role=option]` 的中心點 `elementFromPoint` 全部命中 `.analysisCopy` / `.analysisEyebrow`；`mouse.click` 第 3 筆，左側對手仍是 Dran Sword，清單未收起。
- 390px：第 1–3 筆可 tap（tap 第 3 筆後左側對手為 Dran Buster），第 4–6 筆被陀螺照片蓋住，tap 第 6 筆無反應。
- 鍵盤 ArrowDown + Enter 可選（左側對手變 Dran Arc）。

## 提案

- 讓 `.searchLane` 或 `.searchHeader` 的層級高於 `.analysisCopy`（例如 `.searchHeader { z-index: 3 }`），不用 portal。
- 順手：`input[type=search]::-webkit-search-cancel-button { appearance: none }`，清除改用站上的 icon button；現在是 WebKit 系統藍。
- 注意：`battle-search.tsx` / `.module.css` 目前有另一個 session 的未提交修改（laneLabel），改之前先 `git diff` 對一次。

## 驗收

- `../probe/click.mjs`：1440 與 390 都輸出「clicked option 3 → 左側對手 = Dran Buster」。
- `../probe/verify.mjs` 手機段 `reachable` 為 `[true,true,true,true,true,true]`。
- 把這兩個檢查併入 `scripts/check-ui-interactions.mjs`。

## Comments

（無）
