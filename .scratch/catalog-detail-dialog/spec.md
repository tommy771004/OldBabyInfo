# 圖鑑詳情彈窗

`/parts` 的每一列點下去，詳情以彈窗蓋在列表上，不離開列表。2026-09-13 站方拍板三件事：

1. **網址跟著變。** 彈窗是 Next.js intercepting route（`src/app/[locale]/parts/@modal/(.)[slug]`、`(.)catalog/[id]`）。點列表 → 網址是真正的詳情路徑、畫面是彈窗；返回鍵關閉，列表的篩選、頁碼與捲動位置原封不動；直接打開或重新整理同一個網址 → 完整詳情頁。`generateMetadata`、sitemap、`llms.txt`、`legacy-part-redirects.json` 全部不動。
2. **彈窗只放靜態資料。** 名稱、數值、圖、官方資料、來源判斷、Mold Batch。哪裡買（讀 Neon）留在完整頁與 `/where-to-buy`；討論留在完整頁。彈窗底部一排 text button 連過去。
3. **兩種列都做。** 零件列（`/parts/[slug]`）與陀螺／catalog 列（`/parts/catalog/[id]`）同一個殼；其他世代的卡片格也改成 soft navigation，所以彈窗同樣生效。

## 設計

- 同一個世界（ADR-0006）：卡片是 `surface-container-low`，同一組字，邊框用 `current-border` —— ADR-0008 把 strike 角色定義為「這是你選的那個」，彈窗正是這個狀態。
- 沒有陰影、沒有模糊、沒有淡入／位移進場（`anti-slop-contract.test.ts` 會擋）。原生 `<dialog>` + `showModal()`：top layer 天然壓在手機導覽膠囊之上，焦點鎖在卡片內，Esc 原生可用。
- 遮罩 `--md-sys-color-scrim` 74%：M3 預設的 32% 會讓後方的場邊淺色落進 ADR-0008 量測出來的中段泥褐帶；74% 讓列表退到同一條色階的場上深端。
- ✕ 在自己的一列（`.bar`），不浮在捲動內容上；手機版整頁 sheet，直角、不跑電流（滿版的邊緣電流讀起來像渲染錯誤）。
- 數值只印一次：完整頁把 Attack/Defense/Stamina 印在頂部大數字與「官方資料」的三張卡各一次；彈窗只留頂部那組。
- 關閉的四條路都是 `router.back()`：✕、Esc（`onClose`）、點遮罩（`event.target === dialog`）、瀏覽器返回。關閉後焦點回到開啟它的那一列。

## 驗收（2026-09-13 全部以 Playwright 在 1440 與 390 寬實測）

- 點列 → 網址變、`dialog[open]`、`body { overflow: hidden }`、焦點在 ✕。
- Esc／遮罩／✕ → 回到 `/parts`，`scrollY` 不變，焦點回到該列連結。
- 陀螺彈窗內點原廠組成 → 彈窗內容換成該 Part，返回一次回到陀螺、再返回回到列表（含 query）。
- 「開啟完整頁面」→ 完整頁、無 dialog；硬載入 `/parts/dran-sword` → 完整頁。
- 「查看哪裡買」→ `/parts/x/where-to-buy`，前一個彈窗被 `@modal/[...catchAll]` 收掉。
- `/en/parts` 同樣成立，標籤是英文，連結帶 `/en` 前綴。
- `prefers-reduced-motion: reduce` 下邊框電流 `animation-name: none`；連按 40 次 Tab 焦點不離開 dialog。
- 主控台無錯誤。探針在 `probe/`（`dialog.mjs`、`shots.mjs`、`en.mjs`，`PORT=3210`）。

## 順手拿掉的東西

`/parts/[slug]` 的來源判斷分頁（每頁筆數 5/10/15/20、上一頁／下一頁）。整個資料集只有 2 筆來源判斷，那組控制項從來沒有第二頁；連同 `lib/assessments/pagination.ts`、三個語系的四個字串、html-contract 裡「必須有分頁連結」的檢查一起刪除。
