# 18 — 組合建構器

**What to build:** 使用者挑選 Blade、Ratchet 與 Bit，即時看到這個 Combo 的合成數值。

**Blocked by:** 04, 13

**Status:** done

合成規則以 04 的結論為準。

- [x] 三個部位各有選擇介面，可搜尋與篩選
- [x] 選定後即時顯示合成後的五維 Stat（總重見 Comments，無法提供真實數字）
- [x] 合成規則實作與 04 的結論一致，並附測試覆蓋至少三組已知結果
- [x] Combo 反映於網址，可分享與重新載入
- [x] 未選滿三件時顯示部分結果與明確提示，不顯示錯誤或零值

## Comments

**「總重」照 ADR-0007 的結論不提供，不是漏做。** 票面要求顯示「四項 Stat 與總重」，但
ADR-0007（04 號票的產出，寫在這張票之前）已經明講：官方原始資料的 `weight` 欄位抽樣 9 個
零件全部是 0，數位資料裡沒有真實物理重量，「若本站要做重量相關功能，需另找資料來源」。這張
票沒有無視這個結論湊一個假重量出來，介面上明確顯示一行說明（"官方原始資料裡的重量欄位恆為
0，並非真實物理重量，本站暫不提供重量數字，以免顯示錯誤資訊"）——寧可誠實地不顯示，也不要
顯示錯的。「四項 Stat」同樣是票面舊字（ADR-0007 定案是五維：多 X-Dash／Burst
Resistance），這裡也是照真實五維實作。

**合成規則测試用 ADR-0007 記錄的三組真實案例，不是自己編的數字。** `combo-stats.test.ts`
直接把 04 號票手算驗證過、且與官方 `MasterData.json` 逐位元核對過的三組真實 Combo（Dran
Sword+3-60+Flat、Wizard Arrow+4-60+Ball、Shark Edge+9-80+Taper）當測試期望值。實測結果：
用真實零件資料透過網址組出 Dran Sword+3-60+Flat 這個真實 Combo，畫面顯示 Attack
115／Defense 54／Stamina 41／X-Dash 35／Burst 80——跟 ADR-0007 記錄的手算結果完全一致，
不只是單元測試通過，是端到端（URL → 真實資料 → 畫面）都對得上。

**部分選擇時不顯示誤導性的零值：** Attack/Defense/Stamina 只選 1-2 個部位時，加總仍是有
意義的部分合計（缺席的部位貢獻 0 是 ADR-0007 明訂的規則，不是佔位符），但 X-Dash／Burst
Resistance 只吃 Bit，若 Bit 還沒選，直接顯示數字「0」會誤導成「這個 Combo 的 X-Dash 真的是
0」，因此改顯示「選擇 Bit 後才會顯示」的提示文字。同時只要選了 1 個以上部位但未滿 3 個，
整個數值區塊上方會出現明確提示「尚未選滿三個部位，以下是目前已選零件的合計，不是完整
Combo 的數值」——實測畫面確認兩種狀態（完整三件／只選 Blade）都正確呈現。

**網址狀態：** 三個部位各自獨立的查詢參數（`?blade=&ratchet=&bit=`），清除其中一個不會影響
另外兩個已選的部位。手動改網址指到型別不符的 slug（例如把 Ratchet 的位置塞一個 Blade 的
slug）會被 `resolveSlot()` 忽略、視同未選，不會顯示錯誤或型別錯亂的資料。

**測試：** `combo-stats.test.ts`（5 個測試，含三組真實案例＋缺席部位視為 0＋Blade/Ratchet
不會貢獻 X-Dash/Burst）、`combo-query.test.ts`（5 個測試，涵蓋三欄位獨立讀取、缺席與空字串
視為未選、查詢字串只收錄實際有值的欄位）。

**Pipeline：** `npm run typecheck`、`npm run lint`、`npx vitest run`（157/157）、
`npm run build` 全數通過；`next start` 起正式伺服器後截圖驗證完整三件組合（數值與 ADR-0007
記錄完全吻合）與部分選擇狀態，並用 Playwright 走過真實的搜尋→選取→網址更新互動流程。
