# 05 — Combo Builder：狀態句排在 Stat 數值格裡；槽位卡不等高

Status: needs-triage
Type: task
Priority: P2
Blocked by: 另一個 session 的 `combo-builder.tsx` sequential-candidates 改動落地

## 觀察（已確認 2026-09-13，截圖 `zh_TW_combo_blade_dran_sword@1440.png`）

- 未選 Bit 時，X-Dash 與 Burst 的格子把「選擇 Bit 後才會顯示」放在 `.stat-value` 的位置，用 Combat 顯示字級渲染。
- 三張槽位卡：Blade 165px、Ratchet 422px（含候選清單）、Bit 90px；平行欄位不在同一條線上（anti-slop 契約「ragged comparison grid」）。

## 提案

- 數值格留空（`—`，維持格高與字級），狀態句改 `label-medium` 放在「合成數值」卡的說明句後面（那裡已有「尚未選滿三個部位……」）。
- 槽位卡等高；候選清單在三張卡下方另開一列，不撐高單一張卡。

## 驗收

- `scripts/audit-ui.mjs` 的 parallel-columns 檢查通過。
- `.stat-value` 內只出現數字或 `—`。

## Comments

（無）
