# 搜尋回饋與無結果復原：可用性測試原型

直接用瀏覽器開 `index.html`（不需要 dev server）。樣式與字型走相對路徑指到 `src/styles/` 與 `src/fonts/`，沒有自己的色碼。

- 頂端「提案／現況」切換兩個版本。
- H1：打字時輸入欄下方即時顯示「符合 N 筆」；清單仍等送出。
- H2：無結果時顯示範圍、比對過的欄位、「清除搜尋」與「改搜全部世代 N」；種類分頁不消失。
- 資料：`data/parts.json` 的 190 筆 X Part（含 Stat）與 `data/generation-catalog.json` 的 40 筆其他世代 Part（只有名稱）。內嵌在 `index.html` 的 `#seed` 裡，快照時間 2026-09-07。

測試計畫與推翻條件在 `../spec.md` 第五節。狀態：未執行。
