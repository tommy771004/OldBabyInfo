# 03 — `/parts` 無結果狀態沒有回頭的路

Status: needs-triage
Type: task
Priority: P2
Blocked by: 測試 A（`../spec.md` 第五節）先跑，再定文案與按鈕

## 觀察（已確認 2026-09-13，`../probe/submit.mjs`，截圖 `d_parts_submit_noresult.png`）

- 送出 `zzzzqq`：頁面剩「零件 · 0 筆」與「找不到符合條件的零件」；種類分頁列整列不渲染；沒有清除鈕；世代仍鎖 BEYBLADE X。
- `searchGenerationCatalog` 已比對英文、日文、中文、Alias，但頁面沒說。

## 提案（原型 H2，`../prototype/index.html`）

- 空狀態區塊：標題「在 BEYBLADE X 找不到『{query}』」；說明「已比對英文、日文、中文與玩家俗稱」；動作「清除搜尋」（text）與「改搜全部世代 N」（tonal，只在其他世代有結果時出現，N 為實際筆數，對應 `searchAcrossGenerations`）。
- 種類分頁列保留，計數為 0。
- 不做「你是不是要找」：沒有 Alias 背書的建議是編造（ADR-0004）。

## 驗收

- `catalogQuery=zzzzqq` 時 `a.m3-tab` 仍存在且計數為 0。
- 空狀態內有兩個可點的按鈕；點「清除搜尋」後 URL 不含 `catalogQuery`，焦點在搜尋欄。
- 文案用 CONTEXT.md 的詞：Alias 不寫「別名」。

## Comments

（無）
