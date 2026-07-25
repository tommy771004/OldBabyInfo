# 08 — /styleguide 驗收頁

**What to build:** 一個內部頁面，把色彩、字體與 signature 物件攤開展示，讓設計系統可以被一次驗收而不必到處翻。

**Blocked by:** 05, 06, 07

**Status:** ready-for-agent — done, see Comments

- [x] 展示完整色彩 token，含深暖兩端與過渡示範（色票本身在此頁；連續過渡與對比度深度診斷留在獨立的 `/color-demo`，見 Comments）
- [x] 展示所有字級與字重，中英日三語各一組樣張
- [x] 展示競技場 SVG 於不同尺寸下的表現
- [x] 頁面不對外開放或以 noindex 標記（`robots: { index: false, follow: false }`，已用 curl 驗證 meta 標籤確實輸出）
- [x] 任一 token 變更後，此頁能立即反映，作為往後的回歸檢查點（色票用 `getComputedStyle` 執行期動態讀取，見 Comments）

## Comments

### 跟既有的 /color-demo、/stadium-demo 分工，不是重複

05、07 號票各自留了獨立驗證頁（`/color-demo` 專門診斷漸層對比度、`/stadium-demo` 專門驗證多尺寸縮放），這兩個頁面有各自不可取代的專門用途（ADR-0008 明確把 `/color-demo` 當成活文件引用）。`/styleguide` 不是取代它們，是**總覽**——色彩／字體／signature 一次看完，深入診斷才連到專門頁面，頁面內文字直接附連結說明分工。

### 色票數值是動態讀出來的，不是手打字面值

`color-swatches.tsx` 用 `getComputedStyle(document.documentElement)` 在瀏覽器執行期讀出每個 CSS 變數的實際值再印出來，不是把 hex 碼寫死在 TSX 裡。這樣色票旁邊印的十六進位值永遠跟 `colors.css` 實際定義同步，改了 token 這裡自動反映，不會有兩份數字各自為政、其中一份悄悄過期的風險——這正是這條 AC「任一 token 變更後立即反映」字面上要求的保證，不是用文件字面上「應該會同步」的承諾去交差。

### 視覺驗證

用 Playwright 截圖確認：11 階色票＋4 個 ink/accent 角色全部正確顯示、Combat 標題與數字範例、台北黑體三語×正體/粗體共 6 組樣張、芫荽引言範例、競技場 signature 三種尺寸並排。截圖已傳給你。用 curl 額外確認 `<meta name="robots" content="noindex, nofollow"/>` 真的出現在 HTML 裡，不是只設定了 metadata 物件卻沒生效。
