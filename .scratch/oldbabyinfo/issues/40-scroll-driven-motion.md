# 40 — 捲動驅動旋轉與互動動效

**What to build:** 網站動起來——競技場隨捲動旋轉，互動有回應，而且動的都是本來就看得見的東西。

**Blocked by:** 39

**Status:** done

熱血來自旋轉、離心與碰撞的真實物理，不來自發光與粒子。

- [x] 競技場旋轉綁定捲動位置，非自動播放
- [x] 動效不改變任何內容的可見性；關閉 JavaScript 後頁面內容完全不變
- [x] 尊重 `prefers-reduced-motion`，該設定下動效停止而內容不受影響
- [x] 按鈕不使用滑入時上浮或放大的效果
- [x] 不使用生長式底線動畫
- [x] 動效在中階裝置上維持流暢，不造成捲動掉幀

## Comments

**做法：純 CSS 的 `animation-timeline: view()`，完全不寫 JS。** 首頁本來就是伺服器元件，
沒有任何 scroll listener 或 `requestAnimationFrame`——旋轉是瀏覽器原生的捲動驅動動畫，跑在
合成器執行緒上，不會因為主執行緒忙碌（例如捲動時的其他計算）而掉幀，這也是「動效在中階裝置
上維持流暢」最直接的做法：沒有 JS 就沒有 JS 造成的掉幀。因為完全不靠 JS，「關閉 JavaScript
後頁面內容完全不變」這條在架構上就是必然成立，不需要額外處理——用 Playwright 開一個
`javaScriptEnabled: false` 的 context 實測，標題、CTA、統計數字全部正常顯示。

**真正抓到的 bug：旋轉角度一開始被巻死不動。** 第一版把 `animation-timeline: view()` 直接
掛在 `.heroArt svg` 上，`.hero` 又設了 `overflow: hidden`（票 39 遺留，用來裁掉刻意出血的
超寬 SVG）。用 Playwright 在不同捲動位置讀 `getComputedStyle().transform` 實測時發現，
scroll=0／300／800 三個位置算出來的旋轉角度完全一樣——不是「動效很細微看不出來」，是真的
凍結了。查證後發現：`overflow: hidden` 依 CSS Overflow 規範會讓該元素變成一個「捲動容器」
（scroll container），而 `view()` timeline 預設是相對最近的捲動容器祖先計算進度——於是
瀏覽器把旋轉進度綁到了 `.hero` 自己身上，但 `.hero` 內部從來不會真的捲動（裡面沒有可捲動的
溢出内容，只有一個絕對定位、跟自己等大的圖層），進度自然卡在一個常數。改成 `overflow: clip`
（單純視覺裁切、不建立捲動容器語意，是 `hidden` 的現代替代）後重新量測：scroll=0/200/…/1000
六個位置分別量出 17°／19.8°／22.7°／25.5°／28.3°／31.2°，角度隨捲動位置線性遞增，證實
真的綁定捲動、不是自動播放。這個 bug 完全不會被 `typecheck`／`lint`／`build` 抓到，只有
實際讀取渲染後的 `transform` 計算值才看得出來。

**`prefers-reduced-motion`：** 整個 `@keyframes`／`animation-timeline` 規則包在
`@media (prefers-reduced-motion: no-preference)` 裡，一啟用「減少動態效果」，動畫直接不
套用（實測 `animationName` 回傳 `none`），SVG 靜態顯示、內容不受影響——不是動畫播完就停，
是根本沒有進入動畫狀態。

**按鈕與底線動畫：** 這兩條在票 39 就已經處理過（CTA hover 只變底色，不做 translateY／
scale；文字連結 hover 只變透明度，不做生長式底線），這張票沒有引入新的違規元件，重新檢查
確認仍然符合。

**Pipeline：** `npm run typecheck`、`npm run lint`、`npx vitest run`（116/116）、
`npm run build` 全數通過；`next start` 起正式伺服器後用 Playwright 做三項實測（不是肉眼判斷）：
旋轉角度隨捲動位置變化、JS 關閉後內容完整、`prefers-reduced-motion: reduce` 下動畫確實停用。
