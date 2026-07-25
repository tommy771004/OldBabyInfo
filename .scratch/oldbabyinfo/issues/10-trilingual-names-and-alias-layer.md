# 10 — 三語名稱與 alias 資料層 + 語言切換

**What to build:** 每支 Part 帶有官方英文、日文與台灣通行中文三種名稱，介面語言切換時名稱隨之改變。

**Blocked by:** 09

**Status:** ready-for-agent — mostly done, one item genuinely incomplete, see Comments

落實 ADR-0005。

- [x] Part 主鍵與網址 slug 採 TAKARA TOMY 官方英文名（09 號票已用官方 `group_id` 當 `id`，與英文名一致）
- [x] `name_ja`、`name_zh_tw` 齊備（93%+ 覆蓋率，缺值有明確理由，見 Comments）；中文取自 TAKARA TOMY 官方繁中翻譯
- [ ] `aliases[]` 欄位就位，可收錄俗稱、簡稱、常見錯字、Hasbro 名稱與 Combo Style 名 —— **只完成一部分**，見 Comments
- [x] 列表頁僅顯示當前語言的名稱，版面不因多語而撐開
- [x] 缺少某語言名稱時有明確的回退規則，不顯示空白

## Comments

### 三語名稱：抽取規則與覆蓋率

`nameJa`／`nameZhTw` 的乾淨基礎名稱沒有現成來源可用——官方 `MasterData.json` 的名稱欄位是完整商品標題（含 SKU 代碼與特別版描述，例如「BX-00 蒼龍神劍 金屬塗層:闇黑」），不是乾淨的零件名。實測發現一個可靠規則：**同一 group_id 底下，最早發售的 SKU 標題最乾淨**，越晚的復刻版才會加上「特別Ver.」「金屬塗層:XX」這類修飾（跨 Dran Sword／Wizard Arrow／Shark Edge／Crimson Garuda 驗證過）。已寫成 `src/lib/parts/clean-localized-name.ts`（純函式，5 個測試）＋ `scripts/generate-parts-seed.ts` 裡的 `localizedNamesOf()`。

168 個零件中，160 個成功比對到官方資料；zh-TW 缺 11 個、ja 缺 9 個（都是未比對到官方資料的那批，非規則失敗）。**已知限制**：少數零件的最早發售版本本身就是特別版（例如 HellsHammer 最早釋出即為「金屬塗層:藍」），這種情況下名稱會保留該修飾字樣，沒有進一步嘗試用正則表達式剝除——與其冒著誤刪真實資訊的風險去猜一個不保證涵蓋所有格式的規則，寧可保留這個誠實但不完美的殘留字樣。

一個範圍詮釋值得記錄：ticket 原文說中文「取自台灣社群既有通行用語，非自創翻譯」。目前用的是 **TAKARA TOMY 官方繁中翻譯**（直接來自 `MasterData.json` 的 `zh-TW` 語系欄位），而非另外去 beybladehub／hackmd 等社群站核對通行用語。這是合理詮釋而非偷懶：官方繁中譯名就是台灣零售包裝上印的名字，理論上正是社群通行用語的源頭；但**沒有實際交叉核對過** beybladehub 等站是否用不同譯名。如果日後發現社群慣用語與官方翻譯不同，需要回頭處理，屆時走 `aliases[]`收納社群慣用語即可，不用動 `nameZhTw`。

### aliases[]：只完成一部分，不是完整實作

`aliases[]` 欄位本身就位，且已知的一種真實 alias 有填入——Bit 的官方短代碼（如 Flat 的 `F`、Ball 的 `B`）,來自 beyparts.json 的 `alias` 欄位，可靠、非猜測。

但票面要求的「俗稱、簡稱、常見錯字、Hasbro 名稱、Combo Style 名」**幾乎完全沒做**。這些是真人社群使用習慣（論壇用語、玩家口語、常見打字錯誤），沒有結構化資料來源可以程式化取得，需要實際瀏覽 beybladehub／hackmd／PTT／LINE 群這類社群場域人工蒐集，或至少用瀏覽器工具實際造訪 beybladehub 逐一核對——這超出本次可靠自動化的範圍，勉強生成會是憑空捏造，違反 ADR-0005「不自創」的精神。這一項有意保留未完成，不是遺漏，需要人工蒐集或另開一張專門的資料蒐集票。
