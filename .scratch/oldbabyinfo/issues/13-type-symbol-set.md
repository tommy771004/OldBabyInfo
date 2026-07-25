# 13 — 類型符號組

**What to build:** 一套自繪的類型符號，讓使用者在列表與比較介面中不必讀文字就能辨識零件的攻防傾向、Bit 接地形態與 Ratchet 高度。

**Blocked by:** 06, 09

**Status:** done

高頻畫面只使用自繪符號，官方產品圖僅出現在 Part 詳情頁。

- [x] 攻／防／持久／平衡四種傾向各有專屬符號
- [x] Bit 接地形態與 Ratchet 高度各有一組符號
- [x] 全組共用一致的筆畫粗細、圓角與網格，明顯屬於同一套語言
- [x] 符號直接置於版面上，不套任何色塊、圓角方框或膠囊容器
- [x] 每個符號皆有文字替代，供螢幕閱讀器與符號未載入時使用

## Comments

**Bit 接地形態 = Blade 的同一套傾向分類，不是另一組符號。** 票面文字原本假設 Bit
接地形態是獨立分類，需要另外發明一組符號。實際核對 `beybrew` 的
`beyparts.json`（社群整理的真實資料）後發現，官方資料本身就把 Blade 與 Bit
共用同一個 `type: attack | defense | stamina | balance` 欄位 —— Bit
的接地方式（例如尖頭利於攻擊、平面利於防禦）本來就會反映在同一套四分類上，
不存在另一種「接地形態」分類法。如果照票面字面另外發明一組符號，會是憑空
捏造、且可能與真實資料矛盾的分類。因此把 `playstyle` 欄位同時加到
`bladeSchema` 與 `bitSchema`（`schema.ts`），四個符號共用一套元件
（`PlaystyleSymbol`），只有 Ratchet 高度是另一組符號
（`RatchetHeightSymbol`）。

**符號設計：** 攻擊＝右箭頭 chevron、防禦＝六邊形、持久＝開口的圓環（畫不滿一圈，
暗示「持續轉動」）、平衡＝十字。四個符號共用 `STROKE=6` 筆畫寬度、`SIZE=32`
視覺框、`strokeLinecap="round"` 圓角端點，同一套語言明顯可辨。全部用
`currentColor` 描邊、無任何背景色塊或容器，直接置於表格儲存格中。

**Ratchet 高度符號：** Ratchet 的實際數值（如 "3-70" 的高度是
50，"9-60" 是 85）藏在零件名稱最後的數字裡，不是獨立欄位。寫了
`parseRatchetHeight()` 從 `displayName` 用正則 `/-(\d+)$/` 解析出來，寫入
`generate-parts-seed.ts`。範圍實測落在 50–85（`data/parts.json` 168 筆真實資料
的 35 個 ratchet 全數涵蓋），符號用一條依高度線性縮放的直立長條（
`barHeight = 4 + fillRatio * 22`）疊在共用基準線上表示相對高度。

**每個符號都有 `role="img"` + `aria-label`**（依 locale 顯示在地化文字，如
「攻擊」/「攻撃」/「Attack」），符號未載入或螢幕閱讀器情境下仍可辨識。

**視覺驗證：** 用 Playwright 在 `/parts` 頁面三個捲動位置截圖確認：
- Blade 區段頂部：Dran Sword 等真實攻擊型 Blade 正確顯示 chevron 符號。
- Ratchet 區段（約捲動 3000px）：不同高度的 ratchet 長條高度確實隨數值變化。
- Bit 區段（約捲動 5600px）：R/UF/L/Tr/K/U 等攻擊型顯示 chevron，
  HN/GN/MN/BS 等防禦型顯示六邊形，DB/FB/WB 等持久型顯示開口圓環，
  Op/TK/HT 等平衡型顯示十字 —— 四種符號在同一頁面上明確可分辨，且與各零件
  的真實 `playstyle` 資料一致。

**測試：** `type-symbols.test.tsx` 是這個專案第一個元件級渲染測試，涵蓋四個
playstyle 符號在三種 locale 下的 `aria-label`、balance 符號確實是獨立的兩條
線（不是與其他符號共用 path）、以及 Ratchet 高度符號在真實資料邊界值
（50、85）、中點（67.5）與超出範圍時（999，驗證有 clamp）的長條高度計算。
寫測試時發現 `@testing-library/jest-dom` 雖然是既有依賴，但從未被接上
vitest 的 `expect`（`setupFiles` 是空的）——這個專案先前的測試全是純邏輯
（`.ts`），從未真的渲染過元件，所以這個缺口一直沒被觸發。已補上
`src/test/setup.ts` 並在 `vitest.config.ts` 註冊 `setupFiles`，之後所有
元件測試都能用 `toBeInTheDocument()` 等 matcher。

**Pipeline：** `npm run typecheck`（含 `scripts/tsconfig.json`）、
`npm run lint`、`npx vitest run`（116/116，含新增的 9 個元件測試）、
`npm run build` 全數通過。
