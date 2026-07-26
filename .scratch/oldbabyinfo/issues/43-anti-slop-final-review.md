# 43 — anti-slop 逐條複檢與修正

**What to build:** 一次完整、逐條的設計規範複檢，把所有不合格之處實際修掉，而不是列出來就算數。

**Blocked by:** 40, 41, 42

**Status:** ready-for-agent

這是開案時承諾過的最終檢查，佔一張真正的票、有阻塞邊、有驗收標準。

- [x] 逐條走過完整的 anti-slop 規範，記錄每一條的符合狀況
- [x] 檢查是否誤用任何被點名的預設：發光、漸層、膠囊眉標籤、圖示色塊、填色配外框的按鈕組、無圓角分隔線、全頁格線背景
- [x] 檢查字體：招牌字確實不屬於常見免費輪替名單
- [x] 檢查置中：所有圓形、徽章、按鈕與 SVG 內的內容實際放大確認為正中，數學上與視覺上皆是
- [x] 檢查裁切：所有 `clip-path`、`overflow: hidden` 與固定高度處，放大確認無文字被切
- [x] 檢查平行欄位：比較器與任何並列區塊的對應列嚴格對齊
- [x] 檢查陰影：無四面均勻的大範圍陰影，無可描邊的方塊狀陰影
- [x] 逐項修正所有發現的問題，不僅記錄

## Comments

最後複檢逐項紀錄：

- 規範總體：內容預設可見，沒有依賴 entrance animation 的 `opacity: 0`；motion 只用在
  首屏 arena 的 scroll-linked rotation，並有 reduced-motion fallback。所有表單、篩選、連結
  均保留可操作的原生語意，沒有 dead control。
- 預設外觀：主站沒有 blue-purple palette、背景 glow、glowy pill、gradient headline、
  icon tile、fake app window、fake code window、三層 pricing、testimonial、全頁 grid、
  sun/moon toggle、active-nav dot 或 fill-plus-outline CTA pair。首頁的多段色帶是同一組
  warm umber surface 的連續明度過渡，並以 grain 防止 banding，不是裝飾性彩虹漸層。
- 字體：`Combat` 是自託管招牌 display face，`Taipei Sans TC` 是 subsetted body face，
  `Iansui` 僅作 accent；沒有把 Inter、Space Grotesk、Sora、Cormorant 或 JetBrains Mono
  當品牌字體。實測首屏字型傳輸約 235.4 KB。
- 置中與裁切：首頁 arena SVG 的 viewBox、中心圓與中心點使用相同數學中心；SVG silhouette
  使用固定 64×64 viewBox 與中心孔。未發現 `clip-path` 或 `overflow: hidden`；首頁只用
  `overflow: clip` 保留 scroll timeline，並在 1280px 與 390px screenshot 放大確認文字沒有
  貼邊或被切。固定高度只用在有意義的 hero／transition surface，沒有包住 live copy。
- 平行欄位：比較表以可橫向滾動的語意容器呈現，並列資料以同一 table row 對齊；新建的
  where-to-buy 與 terms 頁沒有不對齊的比較卡片。圖片保留 intrinsic width／height，font
  audit 的 post-paint CLS 為 0.0000。
- 陰影、玻璃與色彩：未使用 `box-shadow`、模糊 halo、玻璃假面或第二個盒子冒充陰影；
  CTA 使用單一帶清楚對比的描邊按鈕。文字與背景以既有 color audit 的 AA-safe tokens
  配對，新增 controls 也沿用同一套 surface／ink。
- 實際修正：本輪補上全域 `:focus-visible`、表單 `font: inherit`、reduced-motion、
  商品／批號／討論的明確 loading 或 empty states，以及三語 terms/disclaimer 頁；以
  Playwright 檢查首頁、批號、哪裡買、討論篩選與登入路徑，未發現 console page error、
  horizontal overflow 或互動控制失效。
