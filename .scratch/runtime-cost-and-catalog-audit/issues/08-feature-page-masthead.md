# 08 — 每個功能頁的版頭加上場地標記，統一版頭

Status: done（2026-11-02）

**需求：** 每個功能頁面 layout 加戰鬥元素，要有一致性。

**做法（ADR-0006：同一套幾何與符號貫穿全站）：**
- `src/components/arena-mark.tsx`：由 `GuidesRidge` 泛化而來，全部從 `STADIUM_GEOMETRY` 畫，`currentColor`、無填色／漸層／glow／動畫，`aria-hidden`。每頁畫同一張場地、同一個旋轉角度，只加重該頁真正相關的結構：

  | subject | 結構 | 頁面 |
  | --- | --- | --- |
  | `ridge` | Tornado Ridge | `/guides`（與原本 GuidesRidge 線重相同） |
  | `launch` | 四個發射位置 | `/events` |
  | `exits` | Xtreme Zone + 兩個 Over Zone 出口 | `/meta` |
  | `xtreme-line` | 牆上的 Xtreme Line 齒軌（X-Dash 是 Combo 的數值之一） | `/combo` |
  | `duel` | 兩個相對的發射位置 | `/parts/compare`（表格／空狀態） |
  | `field` | 場地本身，不強調任何結構 | `/parts`、`/discussion`、`/mold-batches`、`/login` |

  沒有單一誠實對應的頁面用 `field`，不硬編一個意義。零件剪影刻意不用：剪影是對特定 Part 的主張（翼數），拿來裝飾就是假資料。
- 線條用 `vector-effect: non-scaling-stroke`，換算成 Guides 調好的螢幕線寬（1 單位 = 0.28px），所以 8rem、4.5rem 的小標記線重與 17.5rem 的一樣。
- `src/components/page-masthead.tsx`：標題、kicker、lead 在左，標記在右，兩欄 grid，文字永遠不會壓到圖。資料頁 `compact`（8rem，手機 4.5rem 並排標題），Guides `feature`（17.5rem，手機獨立一列 11rem）。
- 各頁原本各寫一套 `.page h1`（四種字級、四種 margin；mold-batches 是 `clamp(2.5rem, 7vw, 5rem)` + `max-width: 12ch`），全部移除，統一 display-small。
- `/parts/compare` 的兩件對戰檢視本身就畫整個競技場，版頭標記會變成同一張圖畫兩次，所以那個狀態 `mark={false}`。
- `/styleguide` 加了六種 subject × 兩種打光的對照。
- 刪除 `guides-ridge.tsx`。

**驗證：** 桌面 1456px 九頁截圖；手機寬度用 headless Chrome 截（最小視窗 500px，仍在 ≤720px 斷點內）；`/styleguide` 兩種打光；anti-slop 契約測試、全套 tests（追加詳情頁後 819）、tsc、eslint、`next build` 綠燈。每頁恰好一個 `<h1>`。

**詳情頁（2026-11-02 追加）：**
- `/guides/[slug]`：`PageMasthead subject="ridge"`，描述當 lead。
- `/parts/[slug]/where-to-buy`：`PageMasthead`（field）。
- `/parts/catalog/[id]`：`MastheadFrame`（只借版面），保留自己的商品編號 kicker，以及在詳情 dialog 裡用 `<h2>` 的標題層級。
- `/parts/[slug]`（含 `/parts` 攔截開出的 dialog）：產品圖／剪影放在場地平面中央（`.visualField`，outline-variant 色），版權說明留在外面。沒有產品圖時只有場地與「尚無產品圖」，不補假圖。
- `/sources/[id]` 跳過：`source-documents.json` 目前是空的，沒有任何頁面會被產生。

**不在範圍：** 首頁（首頁本身就是整個競技場）。
