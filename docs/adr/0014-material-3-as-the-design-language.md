# Material 3 是設計語言，配色不變

站方決定（2026-09-07）：整站 UI/UX 改用 Material 3 設計語言，**配色不動**。

這條 ADR 不取代 [ADR-0006](0006-one-world-two-lightings.md) 與 [ADR-0008](0008-surface-gradient-color-system.md)，而是接在它們上面：0006／0008 決定這個站長什麼溫度、用哪一組色階、動效可以到哪裡；0014 決定「一個按鈕、一個欄位、一個分頁列長什麼樣、叫什麼名字」。之前這一層沒有人決定過，所以每一頁各自手刻了一套控制項——同一件事在 `/parts`、`/events`、`/combo`、`/mold-batches` 有四種寫法，四種高度、四種圓角、四種 focus 樣式。

## 為什麼 M3 接得上這個站

M3 的 scheme 本來就是「一組 tonal palette + 一組角色」。這個站已經有 tonal palette 了（ADR-0008 的 11 階暖色階），缺的正是角色。所以導入 M3 沒有帶進任何一個新色碼：

- `src/styles/m3.css` 裡每一個 `--md-sys-color-*` 都是 `colors.css` 既有 token 的 `var()` 或 `color-mix()`。整份檔案沒有一個新的 hex，也沒有 M3 預設的紫／青／紅。
- ADR-0006 的兩種打光就是兩個 scheme：`:root` 是場邊，`.m3-dark` 是場上。`.m3-dark` 是**子樹** class，不是整份文件的主題——因為首頁要在同一個畫面裡從場上走到場邊。
- `primary` = ADR-0008 的 accent，`tertiary` 與 `error` = strike。strike 本來就是「這是你選的那個」，M3 給 tertiary 的正是這份工作。

每一組會承載文字的前景／背景配對都用真正的 WCAG 公式算過，並寫進 `src/lib/design/anti-slop-contract.test.ts`：任何人之後調動一個 mix 百分比而讓某一組掉到 AA 以下，會在測試裡爆掉，不會安靜地上線。

## 具體採用了什麼

- **色彩角色**：surface 與 5 階 container、on-surface / on-surface-variant、outline / outline-variant、primary / secondary / tertiary / error 及各自的 container 與 on-。
- **Type scale**：display / headline / title / body / label 各三級，字體仍是 ADR-0006 指定的三套。字距與行高按中文調整過——M3 的 tracking 是給 Roboto 調的，正值字距套在漢字上只會把一行拆散。
- **Shape scale**、**state layer**（8% / 10% / 10%）、**motion easing 與 duration**。
- **元件**：button（filled／tonal／elevated／outlined／text）、icon button、chip、card、text field 與 select（含真正的浮動 label）、search bar、tabs、list item、divider、badge、top app bar、navigation bar。全部在 `src/styles/m3-components.css`，手寫，不引入 `@material/web`（那是 Lit web component，會在一個幾乎全 server-render 的站上，替每一顆按鈕拉出一個 client boundary）。

## 刻意的偏離

**Elevation 一律是 tonal，不是投影。** 這正好是 M3 現行的建議（`surface-container-*` 角色就是拿來取代舊的 overlay 的），也讓 anti-slop 契約對環境陰影的禁令保持完整。全站沒有任何一個往外投的 `box-shadow`；深度來自色階與邊緣。

例外只有兩處，而且是同一個條件：**真的浮在會動的內容上面**。手機那顆導覽膠囊（M3 elevation level 2 加鏡面上緣），以及置頂的 top app bar——M3 的 top app bar 有 tonal 與半透明兩種，這裡採半透明版（站方決定）。玻璃只有在底下真的有東西可以取樣時才成立，這兩處剛好都是；蓋在一片平色上的玻璃就只是裝飾，而那正是契約要擋的東西。兩處都在 `anti-slop-contract.test.ts` 的 `DEPTH_ALLOWED` 裡具名，且對比度不是憑感覺——連 `saturate()` 之後的實際算圖像素都量過（見 `site-header.module.css` 的註解，量到 6.05:1）。

**手機導覽是膠囊，不是 M3 的滿版 docked bar**（站方決定，2026-09-07）。形狀是站上自己的，行為是 M3 的：active indicator、state layer，以及 M3 的 `label-visibility: selected`——只有你正在看的那個目的地會顯示文字，其餘只有字符；按下或 tab 到某一個時，它也會先說出自己的名字。文字是 CSS 隱藏而非移除，每一項都帶 `aria-label`，所以無障礙名稱不受影響。

## 順帶修掉的三件事（都是量測出來的，不是看出來的）

1. **中文標題根本沒有用到 Taipei Sans TC Bold。** 標題只寫了 `var(--font-display), serif`，而 Combat 只有拉丁字母，所以每一個中文標題實際上是掉到讀者作業系統剛好裝了什麼明體。ADR-0006 白紙黑字寫的是 Taipei Sans TC Bold。現在每個 display／headline 角色都是 `--font-display` 後面接 `--font-body`。
2. **字型子集是舊的。** 修好第 1 點之後才看得見：`官`、`值`、`使`、`用`、`系`、`統`、`種`、`類`、`量`、`討`、`論` 等 18 個常用字不在子集裡，一個標題會半邊 Taipei Sans、半邊系統明體。`scripts/subset-taipei-sans-tc.py` 的來源清單從來沒有包含 `content/guides/**`，而且檔案在那之後的文案更新後沒有重跑。來源清單補齊並重新產生，每個 weight 從 113KB 變成約 205KB——這是覆蓋完整的代價，值得。
3. **捲動進場動畫把內容藏起來。** 首頁與全站的 `pageFlowIn` / `rise` / `settle` 都是 `opacity: 0 → 1`。量測結果：第一屏以下每一個 section 在被捲到之前 computed opacity 都是 0。在有人捲動的瀏覽器裡沒問題，在任何不捲動的地方都壞掉——列印、PDF、截圖、縮圖，拿到的是一個 section 加一片空白。`@supports` 與 `prefers-reduced-motion` 兩道閘門擋不住這個，因為**支援捲動動畫的瀏覽器正是會把內容藏起來的那些**。現在進場只動位移不動透明度：沒看到動畫的讀者拿到的是一個位置差 2rem 的頁面，不是一片空白。唯一的淡出留在離場那一小段，那是已經讀過、正在離開畫面上緣的內容。

## Consequences

- 新的 UI 一律先找 `m3-components.css` 有沒有現成角色；沒有才自己寫，並在該處說明為什麼 M3 沒有答案。
- 一個元件不准自帶顏色。要顏色就取 role；需要新 role 就加進 `m3.css`，並把它承載文字的配對加進 anti-slop 契約測試。
- `/styleguide` 現在把整組元件在兩種打光下各渲染一次。同一段 markup 渲染兩次，只差一個 `.m3-dark`——某個元件在其中一端讀不出來，就是 role 對應錯了。
- 競技場（首頁 signature）、卡片邊緣的電流、Part 剪影、Xtreme Line stat rail 不是 Material 元件，維持站上自己的語言。M3 對它們沒有意見。
