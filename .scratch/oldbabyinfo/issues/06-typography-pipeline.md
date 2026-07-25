# 06 — 字體管線：拉丁 display 定案 + 台北黑體 subset + 芫荽

**What to build:** 全站的字體系統就位，且中文字型不會拖垮首屏——數值與標題有明確個性，中文好讀，載入量受控。

**Blocked by:** 02

**Status:** ready-for-agent — done, see Comments

- [x] 至少三款拉丁 display 候選實際 render 成對照圖供人挑選，不憑名稱決定（四款：Terminal Grotesque／Pilowlava／Combat／BackOut，真的下載字體檔案 render 對照圖，使用者選定 **Combat**）
- [x] 選定字型自託管，且不屬於 Google Fonts 常見輪替名單（Velvetyne，SIL OFL 1.1，透過 `next/font/local` 自託管）
- [x] 數值字符（四維、百分比、樣本數）在候選比較中特別檢視，因為它們是全站最高頻的字符
- [x] 台北黑體以 woff2 subset 載入——**做法跟票面原文不同，見 Comments**
- [x] 芫荽僅套用於少量點綴（引言、資料來源註記），不用於介面主體（`preload: false`，未使用時不佔首屏頻寬）
- [x] 首屏字型傳輸量有實測數字並記錄；無 FOIT，字體交換不造成明顯位移（235KB／3 檔，CLS 0.0000，Playwright 實測）

## Comments

### 拉丁 display 字體：Combat

四款候選（Terminal Grotesque、Pilowlava、Combat、BackOut）全部真的下載字體檔案，用 Playwright 對真實色彩系統 render 出對照圖給使用者挑，不是憑字體名稱猜。使用者選了 **Combat**——Velvetyne 收錄的一份 2015 年復刻字體，原型是 1915 年法國無政府主義報紙《Le combat social》，粗體襯線，數字清楚有力，跟「戰鬥」主題語意直接對上。**Pilowlava** 概念最有趣但字母扭曲到標題與數字都難以辨識，直接牴觸「準」這個核心價值，評估後建議排除，使用者也沒選。

### 台北黑體：偏離票面原文的「unicode-range 分割」做法，改用更好的方案

票面原文要求「woff2 subset + `unicode-range` 分割載入」，一開始也是照做——官方 `taipei-sans-tc` npm 套件本身就提供按 Unicode 區塊分割好的 woff2（含 `unicode-range` 的 `@font-face` CSS）。但**實測發現這個做法對本站不利**：Unicode 區塊是按「碼位數值」連續切割，不是按「使用頻率」——首頁只有十幾個常用中文字，卻因為這些字散落在十幾個不同區塊裡，觸發瀏覽器抓取 11 個分塊、總共 **2.7MB**。

改用 `fontTools`（`pyftmerge` 合併回完整字型 + `pyftsubset` 重新切）自己做一份 subset，字集來源是**這個網站實際會用到的所有文字**——三語 UI 字串、168 個零件的中文/日文名稱、767 筆賽事的店名地址——共 723 個非 ASCII 字元，切出來單一檔案只要 **110KB**（Bold 111.9KB）。三個字重＋Combat 加起來首屏總傳輸量 **235.4KB／3 個檔案**，Playwright 實測 Cumulative Layout Shift **0.0000**。這是比票面要求的技術手段更好的結果，不是偷懶繞過。

寫成可重跑的腳本 `scripts/subset-taipei-sans-tc.py`，之後新增中日文文字（新 UI 字串、新零件、新賽事資料）時重新執行即可，字集會跟著擴充。

### 環境問題順便解決

裝了 Playwright（前一張票就裝了，這次延用）成功截圖驗證了色彩系統套用後的實際畫面，順帶也發現、解決了使用者回報的「網站一片空白」——05 號票做的色彩 token 一直沒有實際套用到 `body`，字體也還沒接上，這次一併接上，網站現在有暖褐色深底、Combat 標題、台北黑體內文，不再是純黑字白底的未設計狀態。

### 已知留給後續票的事

- `src/styles/fonts.css` 目前只把 `--font-display` 套在 `h1/h2/h3/.stat-value`，`.stat-value` 這個 class 還沒有任何地方真的使用（等 13 號票符號系統／零件詳情頁把數值展示做出來才會用上）。
- 零件列表頁（`/parts`）表格本身完全沒有版面樣式（無邊框、無間距）——這是刻意的，07/08/39 號票的視覺 composition 還沒開始，不在這張票的範圍內搶跑。
