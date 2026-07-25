# 12 — 篩選與排序

**What to build:** 使用者能依零件類型、Stat 數值、系列與發售日縮小與排列 Part 清單。

**Blocked by:** 09

**Status:** ready-for-agent — done, see Comments

- [x] 可依 Blade／Ratchet／Bit 類型篩選
- [x] 可依五項 Stat 各自排序（Attack／Defense／Stamina／X-Dash／Burst Resistance，後兩項只有 Bit 有意義），遞增遞減皆可
- [x] 可依發售日排序
- [x] 篩選與排序狀態反映於網址，可分享與重新整理後保留
- [x] 篩選後結果為零時顯示明確狀態，不是空白列表（程式碼邏輯正確，但目前 UI 只有類型篩選，三種類型都有零件，實際上無法觸發——見 Comments）

## Comments

**Part schema 補了 `releaseAt` 欄位**（必填、可為 null），資料來源同 04／09 號票驗證過的 `MasterData.json` `release_at`，取同一 group_id 下最早的發售紀錄。這是**必填**而非預設值——逼種子產生腳本每次都要明確決定，而不是悄悄漏掉。這個欄位變成必填後，舊的 `data/parts.json`（09/10 號票產生的版本）在 `repository.ts` 的 `.parse()` 當場驗證失敗、建置中止——這正是 09 號票「驗證失敗會導致建置失敗」那條 AC 真的在運作，不是巧合。已重新執行 `generate:parts` 補上。

**過濾／排序邏輯全部是純函式**（`filter-sort.ts`、`parse-filter-sort-params.ts`），18 個測試。頁面本身用 URL 查詢參數驅動、連結導覽，不需要用戶端 JavaScript。

**用 `next start`（正式伺服器模式，非 dev）實際驗證**過 searchParams 在部署後真的會依請求重新渲染，不是建置時凍結的快照：`?type=bit` 回 49 筆、`?type=blade` 回 84 筆，跟資料庫實際筆數完全吻合；`?sort=attack&dir=desc` 確認由高到低排序正確。build 輸出雖然仍標示 `● SSG`，但這不代表查詢參數失效——這點特地花時間驗證過，不是假設。

**零結果狀態誠實揭露一個限制**：程式碼邏輯本身正確（`parts.length === 0` 時顯示提示文字），但目前 UI 只有類型篩選一種篩選條件，三種類型（Blade／Ratchet／Bit）都有零件，沒有任何合法的類型篩選組合會產生零筆結果——這個分支目前無法透過現有 UI 實際觸發驗證，要等 11 號票加入文字搜尋後才有真正的零結果情境。
