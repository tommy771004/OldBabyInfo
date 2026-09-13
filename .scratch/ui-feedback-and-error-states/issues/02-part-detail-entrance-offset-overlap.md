# 02 — Part 詳情：進場位移只套內層 section，同層連結被壓住

Status: ready-for-agent
Type: task
Priority: P1

## 觀察（已確認 2026-09-13，`../probe/verify2.mjs`、`../probe/partzoom.mjs`）

- `/parts/dran-sword` 未捲動時，`main section section`（AssessmentTracer 的 `<section>`、Where-to-buy 空狀態的 `<section>`）computed `transform: matrix(1,0,0,1,0,20)`，動畫是 `pageFlowIn, pageFlowOut`，timeline `view()`。
- 同層的 `<p><Link>`（「查詢其他批號」`page.tsx:211`、「查看完整通路快照」`page.tsx:219`）沒有動畫，段落上緣 = 前一個 section 下緣 − 20px，重疊。捲到 2300px 後 transform 歸零，重疊消失（paraTop 2417 = prevBottom 2417）。
- 全頁截圖 `part_overlap_crop.png` 可見「查看完整通路快照」疊在「這支零件還沒有可顯示的通路資料」上。

## 提案

二選一：
1. 進場動畫的選擇器改套外層 stage（`.physicalStage`、`.stockStage`），內層 section 不再單獨動。
2. 把兩個連結搬進內層 section 的底部，跟著一起位移。

偏好 1：一個 stage 一個位移，讀者看到的是整段一起進來。

## 驗收

- `../probe/partzoom.mjs` 的葉節點重疊輸出為 `[]`（未捲動的全頁截圖）。
- 列印預覽（`emulateMedia({ media: "print" })`）同樣無重疊。

## Comments

（無）
