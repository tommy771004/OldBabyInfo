# 04 — `/parts` 打字期間沒有回饋；世代／系統控制項重複

Status: needs-triage
Type: prototype
Priority: P2
Blocked by: 測試 A（`../spec.md` 第五節）

## 觀察（已確認：現象；待驗證：是否是問題）

- 搜尋欄打字不改變畫面，送出（Enter 或「搜尋」）後才 GET `catalogQuery=`。
- 表單裡的「世代」「系統」select 與表單下方兩列 chip 是同一組選項各出現一次（截圖 `d_parts_top.png`）。

## 假設 H1（原型裡）

即時顯示「符合 N 筆，按 Enter 或『搜尋』查看」能減少送出前的停頓，同時保留 URL 驅動的清單模型。0 筆時改顯示「{世代} 沒有符合的零件，其他世代有 N 筆」。

## 提案（控制項重複）

留 chip（可分享 URL、可被爬），表單只留搜尋欄與送出鈕；手機上世代 chip 列橫向捲動（`m3-chip-set--scroll` 已存在）。

## 推翻條件

測試 A 裡沒有受測者看提示、或提示讓人以為清單已經換了（口述「怎麼沒變」），就拿掉 H1。

## Comments

（無）
