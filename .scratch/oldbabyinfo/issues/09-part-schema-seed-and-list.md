# 09 — Part schema + 種子資料 + 最小列表頁

**What to build:** 訪客能瀏覽一份完整的 Part 清單，看到每支零件的名稱與四項 Stat。

**Blocked by:** 02

**Status:** ready-for-agent

落實 ADR-0001：資料以 repo 內 JSON 為單一真實來源，建置期靜態產生，完全不進資料庫。

- [ ] Part schema 定義完成，含 `generation` 欄位（本版恆為 X）
- [ ] 由官方 MasterData 建立種子資料，涵蓋現行所有 Blade、Ratchet、Bit
- [ ] 資料檔通過 schema 驗證，驗證失敗會導致建置失敗
- [ ] 列表頁以靜態生成產出，無資料庫查詢
- [ ] 使用 CONTEXT.md 的詞彙：Part、Blade、Ratchet、Bit、Stat
