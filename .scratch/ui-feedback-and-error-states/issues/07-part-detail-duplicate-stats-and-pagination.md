# 07 — Part 詳情：Stat 出現兩次；單頁時仍渲染分頁

Status: ready-for-agent
Type: task
Priority: P3

## 觀察（已確認 2026-09-13，截圖 `zh_TW_parts_dran_sword@1440.png`）

- 首屏 `headlineSpec`（`page.tsx:156`）與「官方資料 › 數值」（`page.tsx:197`）各渲染一次相同的 Attack／Defense／Stamina。
- Assessment 只有 1 筆時仍顯示「每頁筆數 5/10/15/20」與「上一頁 第 1/1 頁 下一頁」。

## 提案

- 拿掉「數值」卡片區；「官方資料」只留三語名稱、Alias、Mode。
- `AssessmentTracer` 的 `pagination` 只在總筆數 > 單頁上限時渲染 `nav`。

## 驗收

- 測試 C（`../spec.md`）：單一 Stat rail 版本答對率不低於現況。
- 頁面上 `.stat-value` 的數量 = Stat 欄位數（Blade 3、Bit 5）。

## Comments

（無）
