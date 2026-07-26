# 資料來源與匯入規格

## 目的

OldBabyInfo 將官方資料、通路快照、賽事資料與社群判斷整理成可搜尋的靜態資料。每類欄位只由指定的 Field Authority 決定，主觀判斷保留分歧，全文只有在具有 Publication Rights 時公開。

## 來源矩陣

| 來源 | 用途 | 取得方式 | 可保存內容 | 更新頻率 |
| --- | --- | --- | --- | --- |
| BeyBrew | Part 名稱、官方 Stat、Mode、Part 關係 | 讀取公開 MasterData；不複製未授權程式碼或圖像 | 結構化事實與來源版本 | 每週一次，支援手動觸發 |
| Funbox 戰鬥陀螺分類 | Stock Listing | 只讀商品名稱、價格、庫存、商品網址與抓取時間 | 通路快照，不鏡像商品描述與圖片 | 每日一次 |
| 原始 Event 試算表 | Event 排程與結果 | 從原始表格匯入並保留表格網址 | Event 結構化資料 | 每日一次 |
| BeybladeHub | Tier、Combo、打法等 Discovery Source | 不執行條款禁止的自動大量抓取；採經允許的輸入或人工匯入 | Assessment、必要短片段與原文連結 | 有合法取得方式後每週一次 |
| HackMD 重要資料 | Combo、打法、重量、Event 線索 | 讀取公開頁面中的結構化事實與必要短片段 | Assessment、Discovery Source、原始表格連結 | 每週一次，支援手動觸發 |
| Go-Shoot | Mold Batch、重量、策略觀察 | 讀取可定位的結構化事實與必要短片段 | Mold Batch Observation、Assessment、原文連結 | 每週一次，支援手動觸發 |

來源矩陣只描述預期能力，不取代來源條款。排程啟用前仍要記錄當時適用的授權、robots 與使用條款；禁止自動取得的來源只能停用排程，不能用技術手段繞過。

## 靜態資料模型

### Source Document

只有具 Publication Rights 的完整內容可寫入。

- `id`
- `title`
- `publisher`
- `publishedAt`
- `capturedAt`
- `canonicalUrl`
- `licenseName`
- `licenseUrl`
- `content`

### Assessment

一筆只代表單一來源的一項主觀判斷。

- `id`
- `subjectType`: `part` 或 `combo`
- `subjectId`
- `kind`: `tier`、`recommendedCombo`、`tactic`、`weight` 或 `moldObservation`
- `value`
- `summary`
- `sourceExcerpt`
- `evidenceSource`
- `discoverySource`
- `attributionStatus`: `attributed` 或 `unattributed`
- `publishedAt`
- `capturedAt`

同一 Subject 的衝突 Assessment 全部保留。排序固定為 `attributed` 優先，再依 `publishedAt` 由新到舊；不得平均、投票或合併成本站結論。

### Stock Listing

- `partIds`
- `retailer`
- `productName`
- `price`
- `currency`
- `availability`
- `productUrl`
- `capturedAt`

UI 只顯示 `capturedAt`，不顯示額外的過期推測。

## 管線規則

1. 每個 adapter 只能寫入它擁有的資料家族。
2. 下載、解析、正規化、驗證與寫入分層測試。
3. 所有寫入必須 deterministic，同一份輸入重跑不得產生不同排序或重複項目。
4. 值域錯誤或 Field Authority 衝突進入 Needs Review，不直接發布。
5. 單一來源失敗不得清空上一份成功資料；保留最後成功版本與錯誤摘要。
6. 每次執行記錄來源、開始與完成時間、版本、寫入筆數、略過筆數與錯誤數。
7. 全文授權失效時，可獨立移除 Source Document，而不破壞仍可合法保存的結構化事實。

## 公開呈現

- 有 Evidence Source 時標示原作者、原始貼文或影片。
- 找不到 Evidence Source 時顯示低調的「未附原始來源」，仍保留 Discovery Source。
- Source Document 顯示授權與原文連結。
- Assessment 不得使用官方 Stat 的版型或語氣。
- 外部購買連結直接前往通路，OldBabyInfo 不經手交易。
