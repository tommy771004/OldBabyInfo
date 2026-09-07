# Mold Batch 人工審核與離線合併

對應原專案票 #35／#36、ADR-0004。模型一致只代表可以送審，**不代表已核准發布**。

## 流程

1. 既有抽取器產出 `data/mold-batch-review-matched.json`，每筆 `decision` 一律為 `pending`，`attributionStatus` 預設 `unattributed`。取得文章／呼叫模型仍需既有來源權限與 API 設定；本合併工具不執行它們。
2. 維護者逐筆核對來源片段、批號、重量範圍與目前 Part ID。名稱相似、舊 ID 或 unmatched 不會被合併器猜測對應。
3. 審核檔另存於可追蹤的工作票目錄（如 `.scratch/<feature>/reviews/`），避免下次抽取覆寫人工決定。確認無需公開的個資／祕密後，將審核檔與資料差異一起審查。
4. 接受的列設 `decision: approved`，並填 `reviewedBy`（審核者代號）及 `reviewedAt`（ISO 時間）；拒絕的列設 `rejected` 並填相同審核欄位。未處理者維持 `pending`。
5. 先 dry-run，確認摘要後才由維護者明確要求本機寫入。沒有真實核准資料時不要拿測試 fixture 填滿網站。

```sh
# 預設只驗證／預覽，不改檔、不抓取、不呼叫模型
rtk npm run merge:mold-batches -- <review.json>

# 明確要求本機寫入；不等於提交、合併 PR 或部署
rtk npm run merge:mold-batches -- <review.json> --write

# 測試或獨立工作副本可指定 Parts 檔，不能指向正式資料庫
rtk npm run merge:mold-batches -- <review.json> --parts <parts.json> --dry-run
```

## 審核格式

輸入是一個 JSON 陣列。每列必須包含：

- `partId`：目前 `data/parts.json` 的精確穩定 ID。
- `batchCode`、`note`：批號及來源的實際觀察；不是官方 Stat，也不是本站判斷。
- `sourceUrl`：HTTP(S) 原文連結，不可夾帶帳密。
- `sourceExcerpt`：足以支持這一筆觀察的必要原文片段。抽取器目前可能用整篇共用片段作回退，**人工必須逐筆確認支持關係，不能僅確認字串非空**。
- `capturedAt`：實際取得來源的 ISO 時間，不能以合併時間冒充。
- `attributionStatus`：只有在 `sourceUrl` 真正定位提出判斷的 Evidence Source 時才可改為 `attributed`；彙整頁或找不到原始來源一律 `unattributed`。
- `decision`：`pending`／`approved`／`rejected`；後兩者另需 `reviewedBy`、`reviewedAt`。
- 選用 `weightGrams: { min, max }`：正值且 `min <= max`。

舊版抽取檔缺少決定、時間或來源欄位時會拒收。只能由人查證後補齊，工具不自動猜日期或補核准。

## 合併規則

- 只合併 `approved`；`pending` 與 `rejected` 計入摘要但不發布。
- 只新增 `moldBatches`，不修改 Part 身分、Stat、名稱、Alias 或其他欄位。
- `(partId, batchCode, sourceUrl)` 為觀察識別鍵。完整內容相同則略過，重跑不產生重複資料，也不重寫檔案。
- 同鍵不同內容直接拒絕整批，不用最後寫入者覆蓋。更正既有判斷需另外審查精確 Git diff；本工具不提供強制覆寫開關。
- 不同来源的相異觀察並存，不平均、不刪掉分歧。
- 全批通過 schema 與 Part 關聯驗證後才寫入同目錄暫存檔並原子替換；偵測到 Parts 在讀取後已被更改會拒絕。仍應避免另一個程序同時編輯該檔，這不是跨程序交易鎖。
- 審核身分留在審核檔，不加入公開 Part payload。合併器驗證欄位存在，**不認證填寫者真的經過人工審核**；人工核准 PR 仍是最終權限邊界。

## 驗證邊界

單元測試與 CLI 測試只使用合成資料；CLI 在測試自己建立的暫存目錄操作，禁止網路。這證明本機審核／合併契約，不證明真實文章取得、雙模型抽取結果或來源事實正確。沒有真實核准內容時，正式 Mold Batch 資料維持空白。
