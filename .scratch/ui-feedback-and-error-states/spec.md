# 介面改善方案：資訊層級、操作回饋、錯誤處理

Status: needs-triage
Date: 2026-09-13
Scope: 公開路由（首頁、/parts、Part 詳情、/combo、/meta、/events）；不動 `styleguide` / `color-demo` / `stadium-demo`。

這份文件只提案，不宣稱任何一項改動已驗證有效。每一項都分成「觀察（已量測）」「問題」「提案」「怎麼驗證」四段；觀察標為 **已確認** 的，附有可重跑的量測方法；標為 **待驗證** 的，只是假設。可用性測試全部標 **狀態：未執行**。

## 量測方法

- 站台：`npm run dev` 的本機版（本次量測時用 `PORT=3210`，避開另一個 session 在 3000 埠的伺服器），程式碼是 2026-09-13 的工作樹（量測當時 combo-builder / battle-search / site-header 的修改尚未提交，之後由另一個 session 提交為 df33331）。
- 工具：Playwright（`node_modules/playwright`），1440×1000 與 390×844 兩種視窗。桌機用 Chrome UA，手機用 iPhone Safari UA；`src/lib/security/guard.ts` 會擋 HeadlessChrome 的預設 UA，這點不改。
- 腳本：`probe/*.mjs`。每支頂端有 `PORT` 讀取，`cd .scratch/ui-feedback-and-error-states && PORT=3000 node probe/shoot.mjs` 即可重跑。截圖輸出到 `.scratch/ui-feedback-and-error-states/shots/`（已 gitignore）。
- 「被蓋住」的判定：對每一個 `[role=option]` / 連結中心點做 `document.elementFromPoint`，回傳的元素不在該控制項內就算被蓋住；再用真實的 `mouse.click` / `touchscreen.tap` 確認是否選得到。
- 對比度：本次沒有引入任何新色碼，沿用 `m3.css` 已在 `anti-slop-contract.test.ts` 裡斷言過的角色配對。原型裡唯一新的配對是 `error`（strike）文字放在表單底上：在 `surface-container-low`（#ebd9bf）用 WCAG 公式實測 4.52:1，只剛過 AA，所以原型把表單底改成 `surface-container-lowest`（surface-50，ADR-0008 實測 5.59:1）。正式站若採用 H1，這個訊息不能放在比 container-lowest 更深的底色上。

## 一、發現總表

| # | 路由 | 類別 | 狀態 | 一句話 |
| --- | --- | --- | --- | --- |
| 01 | `/`（首頁搜尋） | 操作回饋 | **已確認** | 搜尋結果清單被競技場的分析文案層蓋住，桌機滑鼠點不到任何一筆；手機第 4–6 筆點不到 |
| 02 | `/parts/[slug]` | 資訊層級 | **已確認** | 捲動進場位移只套在內層 section，同層的「查看完整通路快照」「查詢其他批號」在捲到之前被壓在下面 |
| 03 | `/parts` | 錯誤處理 | **已確認** | 無結果只剩一行「找不到符合條件的零件」，種類分頁整列消失，沒有回頭的路；預設世代是 BEYBLADE X，跨世代的名字會直接落空 |
| 04 | `/parts` | 操作回饋 | **已確認**（現象）／**待驗證**（是否是問題） | 打字期間沒有任何回饋，要送出才知道有沒有；同一組世代／系統選項在表單與 chip 列各出現一次 |
| 05 | `/combo` | 資訊層級 | **已確認** | 「選擇 Bit 後才會顯示」用 Stat 數字的字級與字體排在數值格裡；三個槽位卡高度不齊 |
| 06 | `/parts`、`/events` | 資訊層級 | **已確認**（現象）／**待驗證**（是否是問題） | `/parts` 一次渲染 295 列（桌機 25,377px、手機 58,951px）；`/events` 621 場一次渲染（手機 7,608px），沒有「今天」錨點 |
| 07 | `/parts/[slug]` | 資訊層級 | **已確認** | 同一組 Stat 在首屏與「官方資料」區各出現一次；只有 1 筆 Assessment 時仍渲染每頁筆數與上下頁 |
| 08 | `/`（首頁） | 待調查 | **已確認**（現象） | 開發模式 console 有 hydration mismatch 警告，未追根因 |
| 09 | `/meta` | 錯誤處理 | **已確認** | 空狀態之前先排三段免責文字；目前 Sample Size 為 0，整頁只有免責 |
| 排除 | `/events` | 工具誤報 | 已排除 | `probe/covered.mjs` 回報「資料來源」連結被蓋住，是 `<details>` 收合時的量測假象；展開後 `elementFromPoint` 命中連結本身 |

票在 `issues/`，編號對應。

## 二、資訊層級

### 原則

站上的閱讀任務是「查一個 Part 或 Combo，確認數字對不對，看是誰說的」。層級應該由這個任務決定：

1. **第一層：識別。** 名稱（中／英／日）、種類（Blade／Ratchet／Bit）、世代。讀者要在 1 秒內確認「這是我要找的那個」。
2. **第二層：官方 Stat。** 只出現一次，在首屏。ADR-0007 說 Stat 來自官方，那它就不該在同一頁用兩種排版各講一次。
3. **第三層：有出處的判斷。** Assessment、Mold Batch、Stock Listing，各自帶 Attribution Status 與抓取時間。
4. **第四層：互動。** 討論、Combo 加入、比較。

現況違反的地方：

- **Part 詳情（07）**：Stat 在首屏 `headlineSpec` 出現一次，又在「官方資料 › 數值」用三張卡片出現一次。第二次是純重複，讀者會懷疑兩組數字是不是不同來源。提案：拿掉「數值」卡片區，「官方資料」只留三語名稱、Alias、Mode；首屏的 Stat rail 就是唯一的官方數值。分頁控制（每頁筆數、上一頁／下一頁）只在筆數大於單頁上限時渲染，否則整個 `nav` 不出現。
- **Combo Builder（05）**：X-Dash 與 Burst 的格子在還沒選 Bit 時，把一句話「選擇 Bit 後才會顯示」放進 `.stat-value` 的位置，用 Combat 顯示字級渲染。這是把狀態文字當成數值。提案：數值格留空位（`—` 或空白，維持格高），狀態句改用 `label-medium` 放在格子底部或整個「合成數值」卡的說明句裡（那裡已經有一句「尚未選滿三個部位……」，直接補在後面就好）。三個槽位卡：ADR-0014 與 anti-slop 契約都要求平行欄位落在同一條水平線上；目前 Blade 卡 165px、Ratchet 卡 422px、Bit 卡 90px。這部分 `combo-builder.tsx` 正被另一個 session 改（sequential candidates），**本票只記錄目標，不動檔案**：三張卡等高、候選清單在卡片下方另開一列而不是撐高其中一張。
- **`/parts`（04、06）**：世代與系統各有兩組控制項（表單裡的 select、表單下的 chip）。兩組狀態一致時是重複，不一致時是矛盾。提案：留 chip（它們是連結、可被爬、可分享 URL），表單只留搜尋欄與送出鈕；世代 select 在手機上改成 chip 列的橫向捲動。295 列一次渲染的問題見六。
- **`/meta`（09）**：Sample Size 為 0 時，整頁是三段免責加一個空狀態。免責文字是對的（ADR-0009），但順序反了：讀者先要知道「這裡有什麼」，再知道「怎麼讀」。提案：空狀態卡上移到標題正下方，三段說明收成一個 `details`（標題「這裡的數字怎麼算」），有資料之後才展開成正文。

## 三、操作回饋

### 原則

- 每一個會改變畫面的操作，在 100ms 內要有可見的狀態變化；會改變 URL 的操作，要讓人知道 URL 變了（chip 的 `aria-current`、tab 的指示條，這兩個現在都有）。
- 搜尋是本站的主要操作（ADR-0006 說首屏主要操作是跨語言搜尋）。它的回饋要在三個時間點各有一次：打字時、送出時、結果出現時。

### 01 首頁搜尋結果清單被蓋住（P0）

**觀察（已確認，`probe/stack.mjs`、`probe/click.mjs`、`probe/verify.mjs`）**

- `.results` 是 `position: absolute; z-index: 4`，但它的祖先 `.searchHeader` 是 `position: relative; z-index: 2`，形成 stacking context；`.analysisCopy` 同樣 `z-index: 2` 而且在 DOM 裡更後面，所以整個清單被畫在分析文案下面。
- 1440px：6 筆結果的中心點 `elementFromPoint` 全部命中 `.analysisCopy` 或 `.analysisEyebrow`；用滑鼠點第 3 筆，左側對手沒有改變，清單也沒收起來。
- 390px：前 3 筆可點（點第 3 筆後左側對手變成 Dran Buster），第 4–6 筆被陀螺照片蓋住，tap 第 6 筆沒有反應。
- 鍵盤 ArrowDown + Enter 可以選到（左側對手變成 Dran Arc），所以純鍵盤使用者不受影響。

**提案**

- 把 `.results` 從 `.searchHeader` 的 stacking context 裡放出去：最小改法是 `.searchHeader` 的 `z-index` 抬到高於 `.analysisCopy`（例如 3），或給 `.searchLane` 自己的 `position: relative; z-index: 5`。不建議用 portal，因為清單要跟著輸入框的位置。
- 清單本身補一個不透明底（現在是 `surface-container` 但底下有照片時看起來像半透明，因為蓋在上面的是文案不是清單）。
- 回饋：打字後 150ms 內清單要出現、`aria-expanded` 要翻成 true（現在已有）；選擇後輸入框顯示選中名稱、清單收起、競技場重算。這三個已經存在，只是第一個被蓋住看不到。

**驗證（可自動化，加進 `scripts/check-ui-interactions.mjs`）**

- 對每個 `[role=option]`：中心點 `elementFromPoint` 必須落在該 option 內。
- 用 `mouse.click` 點第 3 筆與最後 1 筆，左側對手的名稱必須變成該筆。
- 在 1440 與 390 兩種寬度各跑一次。

### 04 `/parts` 搜尋在送出前沒有回饋

**觀察（已確認）**：搜尋欄打字不改變任何東西；要按 Enter 或「搜尋」才會送出 GET，URL 帶 `catalogQuery=`。送出後的「零件 · N 筆」在頁面頂端，離結果表 500px 以上。

**假設（待驗證）**：玩家打完字會等清單變，等不到會以為壞了。這是猜的，所以做原型測。

**提案（H1，放在原型裡）**：保留「送出才換清單」的模型（URL 可分享、可被爬、伺服器端渲染都靠它），但在輸入欄下方用 `m3-field__support` 即時顯示「符合 N 筆，按 Enter 或『搜尋』查看」。0 筆時，若其他世代有結果，改顯示「BEYBLADE X 沒有符合的零件，其他世代有 N 筆」。清單不動，只有這一行動。

### 首頁搜尋欄的取消鈕是瀏覽器藍色

`input[type=search]` 的 WebKit 取消鈕用系統藍，不在色階上（截圖 `d_home_search_hit.png`、`d_parts_noresult.png` 都看得到）。提案：`::-webkit-search-cancel-button { appearance: none }`，清除改用站上自己的 icon button。放進 01 票一起處理。

## 四、錯誤處理

### 原則

- 錯誤訊息要說三件事：**找了什麼範圍**、**為什麼可能沒有**、**下一步能按什麼**。「找不到符合條件的零件」只說了第一件的一半。
- 空狀態不是錯誤。`/meta` 的 Sample Size 為 0、Part 的 Stock Listing 為 0，都是資料誠實地說「還沒有」，排版要跟「你打錯了」區分開。
- 錯誤狀態不能拿走導覽。無結果時種類分頁消失，等於把讀者的地圖收走。

### 03 `/parts` 無結果沒有回頭的路（P2）

**觀察（已確認，`probe/submit.mjs`，截圖 `d_parts_submit_noresult.png`）**

- 送出 `zzzzqq` 後：頁面剩「零件 · 0 筆」與一行「找不到符合條件的零件」；種類分頁列（陀螺／零件／Blade／Ratchet／Bit……）整列不渲染；沒有清除鈕；世代仍鎖在 BEYBLADE X。
- 目前搜尋比對英文、日文、中文與 Alias（`searchGenerationCatalog`），但頁面沒有告訴讀者這件事，所以讀者不知道打俗稱其實是可以的。

**提案（H2，放在原型裡）**

- 空狀態改成一個 `surface-container` 區塊，標題「在 BEYBLADE X 找不到『zzzzqq』」，說明句「已比對英文、日文、中文與玩家俗稱」，兩個動作：「清除搜尋」（text button，回到未搜尋狀態並把焦點放回輸入欄）與「改搜全部世代 N」（tonal button，只在其他世代有結果時出現，N 是實際筆數）。
- 種類分頁列留著，計數歸零。
- 不加「你是不是要找 ○○」的模糊建議：那需要一個相似度演算法，而且猜錯就是編造；Alias 層本來就是為了讓人打俗稱也搜得到，該補的是 Alias 資料，不是猜。

### 02 Part 詳情的段落連結被進場位移壓住（P1）

**觀察（已確認，`probe/verify2.mjs`）**

- `pageFlowIn`（`animation-timeline: view()`）套在 `main section section`（`AssessmentTracer` 的 `<section>` 與 Where-to-buy 空狀態的 `<section>`）上，未捲到時 `transform: translateY(20px)`；跟它同層的 `<p><Link>`（「查詢其他批號」「查看完整通路快照」）沒有這個動畫，所以連結的上緣比前一個 section 的下緣高 20px，被壓在下面。捲到 2300px 之後 transform 歸零，重疊消失。
- 這是 ADR-0014 說的「進場只動位移」的副作用：內容沒有消失，但捲動途中會看到 section 滑過連結，列印／全頁截圖會定格在重疊狀態。

**提案**：進場動畫套在外層 stage（`.physicalStage`、`.stockStage`）而不是內層 section，讓連結跟著同一個位移走；或把兩個連結搬進內層 section 的底部。驗證方式：全頁截圖後用 `probe/partzoom.mjs` 的葉節點重疊檢查，任何兩個文字盒交集面積不得大於 8×8px。

### 08 首頁 hydration mismatch（待調查）

開發模式 console：「A tree hydrated but some attributes of the server rendered HTML didn't match the client properties.」只在 `/` 出現，`/parts` 等頁沒有。本次沒有追出是哪個屬性；記成 research 票，不在這裡猜原因。

## 五、原型與可用性測試

原型只做一個，針對不確定性最高的兩個假設（H1、H2），其他項目用測試計畫而不是原型。原型在 `.scratch/ui-feedback-and-error-states/prototype/`（同一份發佈成 Artifact 方便傳給受測者：https://claude.ai/code/artifact/171c9aff-dee4-4e7b-aae5-25afd0421575 ，預設私人，要分享請從頁面的 share 選單開）。它用正式站的 `colors.css`、`m3.css`、`m3-components.css` 與三支自架字型，沒有自己的色碼；零件資料取自 `data/parts.json`（190 筆 X Part）與 `data/generation-catalog.json` 裡 40 筆其他世代的 Part（只有名稱，沒有 Stat，原型也就不顯示 Stat）。原型頂端有「提案／現況」切換，讓同一位受測者兩種都看。

### 測試 A：搜尋回饋與無結果復原（H1、H2）

- **假設 H1**：打字時即時顯示「符合 N 筆」，能讓受測者在送出前知道方向對不對，減少「打完等清單」的停頓。
- **假設 H2**：無結果時給「清除搜尋」與「改搜全部世代 N」，受測者能在 10 秒內回到有結果的狀態，而不是重新整理或離開。
- **受測者**：5 位有在打 Beyblade X 的玩家（含 2 位主要用手機），不找開發者。
- **任務**：
  1. 「找一下蒼龍神劍的數值。」（有結果，中文）
  2. 「找 Lost Longinus。」（X 世代沒有，Burst 有）
  3. 「找 DrSw。」（Alias，有結果）
  4. 「隨便打一個你記得的俗稱。」（開放，記錄落空率）
- **量測**：每個任務從開始打字到看見結果的秒數；任務 2 是否用到「改搜全部世代」；是否有人在 H1 提示出現前就按 Enter；任務 4 落空的詞收進 Alias 待補清單。
- **推翻條件**：若 5 位裡有 3 位以上在任務 2 沒有點「改搜全部世代」而是改用其他方式（重打、改 select、放棄），H2 的動作標籤或位置有問題。若 H1 的提示沒有人看（眼動或口述都沒提到），拿掉它。
- **狀態：未執行。**

### 測試 B：首頁搜尋結果可點性（01）

這不需要可用性測試，是功能壞掉。用自動化驗證：`probe/click.mjs` 在修好後應輸出「clicked option 3 → 左側對手 = Dran Buster」；`probe/verify.mjs` 手機段 reachable 應為 `[true×6]`。**狀態：未執行（修法尚未實作）。**

### 測試 C：Part 詳情的層級（07）

- **假設**：拿掉第二組 Stat 卡片後，受測者仍能在 5 秒內說出 Attack 值，且不會問「哪一組是官方的」。
- **方法**：紙本或截圖 A/B，5 位受測者，各看一種版本，問「這支 Blade 的 Attack 是多少，你怎麼知道」。
- **推翻條件**：B 版（單一 Stat rail）的答對率低於 A 版，或有人找不到數字。
- **狀態：未執行。**

### 測試 D：長清單策略（06）

- **假設**：`/parts` 的讀者主要靠搜尋與分頁進入，很少從頭捲到尾；因此把全列表改成「預設只顯示目前分頁的前 60 筆，其餘按『顯示更多』或改用搜尋」不會傷到主要任務。
- **這個假設要先用資料驗證，不要先做原型**：在 Vercel Analytics 或現有 log 裡看 `/parts` 的捲動深度與 `catalogQuery` 出現比例，一週資料。若超過 30% 的 `/parts` 造訪捲到 50% 深度以上，假設不成立，改成虛擬捲動而不是截斷。
- **狀態：未執行。** SEO 影響另外評估：靜態渲染全部列有它的用途，截斷前要確認 sitemap 與 `llms.txt` 不靠這頁列舉。

## 六、優先序

| 優先 | 票 | 為什麼 |
| --- | --- | --- |
| P0 | 01 | 首屏主要操作用滑鼠做不到。 |
| P1 | 02 | 可見的重疊，列印與截圖會定格。 |
| P2 | 03、04 | 錯誤處理與回饋，需要測試 A 之後決定細節。 |
| P2 | 05 | 明顯的層級錯置；等另一個 session 的 combo-builder 改完再動。 |
| P3 | 07、09 | 純排版整理。 |
| research | 06、08 | 先量再做。 |

## 七、不做的事

- 不做模糊搜尋建議（「你是不是要找」）：沒有 Alias 資料背書的建議就是編造。
- 不把長清單換成無限捲動：靜態列表是 ADR-0001 的產物，先看資料。
- 不在這一輪改配色、字型、動效語言：ADR-0006 / 0008 / 0014 已定，這裡只處理層級、回饋、錯誤。
