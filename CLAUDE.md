# OldBabyInfo

台灣的 Beyblade X 查詢工具與社群站。核心價值是「準」—— 讓真實的零件與賽事資料找得到、而且是對的。

## 每次動工都成立

- **不編造。** 缺的資料就說缺，不要補一個看起來合理的值；LLM 在這個 repo 是格式轉換器，不是事實來源（ADR-0004）。
- **綠燈不等於做完。** typecheck / lint / test / build 全過仍可能畫面是壞的。UI 改動要在瀏覽器裡看過；對比度用 WCAG 公式算，不要用眼睛估（ADR-0008）。
- **Field Authority 的擋阻是功能，不是待修的 bug。** 永遠不要為了讓排程變綠而繞過 `assertBeybrewRefreshAllowed`、拿掉 provenance、或改動 phstudy 歸屬（ADR-0010 / ADR-0013）。
- **主觀資訊一律標來源。** 站上不產生自己的排名或推薦，只轉述有出處的評價（ADR-0009）。
- **命名照 CONTEXT.md 的詞。** Combo 不是配招、Meta Standing 只給賽事統計、Blade / Ratchet / Bit 不翻成上蓋 / 固鎖 / 軸心。詞彙表沒有的概念先停下來想，可能是在發明這個專案不用的語言。
- **Issue 是檔案。** `.scratch/<feature-slug>/issues/NN-slug.md`，狀態寫成 `Status:` 一行。

## 動手前先讀

只讀跟這次工作有關的那幾份，不要整批載入。

| 要動的東西 | 先讀 |
| --- | --- |
| 任何 UI / CSS / 版面 | `docs/adr/0006`（一個世界兩種打光）、`docs/adr/0008`（表面色階與 strike/accent）、`src/lib/design/anti-slop-contract.test.ts`（anti-slop 中可機器檢查的部分） |
| 零件資料、`data/parts.json`、refresh 腳本 | `docs/adr/0010`、`docs/adr/0013`、`docs/agents/data-refresh-recovery.md` |
| 賽事資料、ingest、排程 workflow | `docs/agents/data-refresh-recovery.md`、`data/event-sources.json` |
| 為任何東西命名（UI 文案、schema 欄位、issue 標題） | `CONTEXT.md` |
| 外部資料來源、抓取、全文轉載 | `docs/adr/0011`、`docs/adr/0012`、`CONTEXT.md` §資料來源、`data/community-source-policy.json` |
| Combo 數值組成 | `docs/adr/0007` |
| 開票、改狀態 | `docs/agents/issue-tracker.md`、`docs/agents/triage-labels.md` |
| 模具批次 | `docs/agents/mold-batch-review.md` |
| 社群資料庫 | `docs/agents/community-db-verification.md` |

完整 ADR 列表在 `docs/adr/`，領域詞彙表在 `CONTEXT.md`。輸出若和某條 ADR 相牴觸，明講出來再談，不要默默蓋過去。

一個常踩的事實：本專案引入了 Tailwind Preflight，`h1`–`h6` 被重設為 `font-size: inherit`。沒有自己 CSS 規則的標題會用內文字級渲染。
