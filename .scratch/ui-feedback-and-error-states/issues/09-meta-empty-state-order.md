# 09 — `/meta`：免責文字排在空狀態前面

Status: ready-for-agent
Type: task
Priority: P3

## 觀察（已確認 2026-09-13，截圖 `zh_TW_meta@1440.png`）

Sample Size 為 0 時，頁面順序是：標題、一句說明、兩個 `surface-container` 免責框、然後才是「目前尚無已記錄的賽事結果資料」空狀態卡。整頁沒有一個數字。

## 提案

- 空狀態卡緊接標題。
- 兩段免責（無 S/A/B 等級、比例分母）收進一個 `<details>`，摘要「這裡的數字怎麼算」；Sample Size > 0 時展開成正文放在表格上方。
- 文案維持 ADR-0009：不產生本站排名，只轉述可計算的賽事結果。

## 驗收

- `/meta` 首屏（1000px 高）內看得到空狀態卡與它的兩個動作。

## Comments

（無）
