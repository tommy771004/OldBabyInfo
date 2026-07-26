# 17 — 零件比較器

**What to build:** 使用者能同時並排 2 至 4 支 Part，逐項比較其 Stat 與特性。

**Blocked by:** 09, 13

**Status:** done

- [x] 可加入 2 至 4 支 Part 進行比較，並可個別移除
- [x] 對應項目在所有欄位間嚴格對齊同一條水平線：名稱、符號、各項 Stat
- [x] 欄位高度不受某一欄文字較長影響；缺值時保留該格位置而非塌陷
- [x] 每一列標示出最高值，使差異一眼可見
- [x] 比較組合反映於網址，可分享
- [x] 於窄螢幕下仍維持可比較性，不退化成上下堆疊的獨立卡片

## Comments

**對齊用真正的 `<table>`，不是自己拼 CSS Grid。** 「對應項目嚴格對齊同一條水平線」跟「欄位
高度不受某一欄文字影響」這兩條，最穩妥的做法就是用瀏覽器原生表格排版本身的保證——零件是欄
（column），屬性是列（row，`<tr>`），同一列裡每個儲存格天生就是同一個列高、同一條水平線，
不需要自己算 grid-template-rows 或搞任何對齊 hack。這正是 anti-slop 規範點名的
「misaligned parallel columns」問題最直接的解法：選對 HTML 語意，問題本身就不存在。

**缺值不塌陷：** X-Dash／Burst Resistance 只有 Bit 才有，Blade／Ratchet 比較時這兩列顯示
「—」但儲存格本身還在（不是整列消失或欄位錯位）。`highestIndices()`（純函式，見測試）明確
排除 `undefined` 不參與最高值比較，也不會被誤判成贏家。

**網址狀態：** 整個比較組合收斂成一個查詢參數 `?with=slug1,slug2,...`（`compare-query.ts`），
用真正的 `<Link>`（不是 JS onClick 呼叫 router.push）觸發加入／移除——這代表就算 JS 還沒
hydrate，這些連結本身也是可點的真實網址，不是假的互動裝飾。上限 4 支、自動去重複，就算網址
被手動改到超過 4 個 slug 也會在解析階段截斷，不會讓比較器意外顯示 5 支以上。

**窄螢幕：** 表格外層包一個 `overflow-x: auto` 的容器，不是讓表格自己縮小或讓 CSS 把欄位
堆疊成卡片。實測在 390px 寬視窗下，容器 `scrollWidth`（424px）確實大於 `clientWidth`
（390px）且 `overflow-x: auto` 生效——欄位並排的比較性維持，使用者用橫向捲動看到更多零件，
不會退化成一張一張直的卡片。

**互動流程實測：** 用 Playwright 走過真實使用者路徑（不是只檢查靜態網址渲染）——空狀態下
搜尋「蒼龍」→ 點擊加入「蒼龍神劍」→ 網址正確變成 `?with=dran-sword`；再搜尋「Zap」→ 點擊
加入 → 網址正確變成 `?with=dran-sword%2Czap`；點擊「移除」→ 網址正確變回 `?with=zap`。
過程中兩個一開始像是 bug 的現象後來確認都是測試本身的問題，不是程式問題：一次是
`waitForLoadState('networkidle')` 判斷時機太早，改用等待網址真的變化解決；一次是搜尋
「Zap」後點擊的連結文字顯示「Z」不是「Zap」——因為連結顯示的是目前 zh-TW 介面語言下的
在地化名稱（這顆 Bit 的中文名稱就是「Z」），不是英文名，這是既有的、正確的
`localizedNameOf()` 行為，不是這張票引入的問題。

**測試：** `compare-query.test.ts` 涵蓋網址解析（去重複、上限 4、忽略空白片段）與查詢字串
組建；`compare-highlight.test.ts` 涵蓋最高值判定（單一最高、平手時全部標示、
`undefined` 不參與比較、全部缺值時回傳空集合）。

**Pipeline：** `npm run typecheck`、`npm run lint`、`npx vitest run`（147/147）、
`npm run build` 全數通過；`next start` 起正式伺服器後截圖驗證 3 支零件同時比較（含最高值
粗體標示）、手機寬度下橫向捲動而非堆疊、並用 Playwright 走完整個加入／移除互動流程確認網址
狀態正確更新。
