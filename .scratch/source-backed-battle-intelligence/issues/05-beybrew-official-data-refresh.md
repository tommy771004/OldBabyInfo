# 05 — BeyBrew 官方資料更新

**What to build:** 維護者可每週或手動更新官方 Part 名稱、Stat、Mode 與關係，使用者看到的官方資料始終來自指定 Field Authority。

**Blocked by:** None — can start immediately

**Status:** ready-for-agent

- [ ] 匯入只讀取 MasterData 中的結構化官方事實與來源版本
- [ ] 未授權的程式碼、全文與圖像不被複製進資料集
- [ ] 官方值變更產生可審查的 deterministic diff
- [ ] 非 Field Authority 的來源不能覆蓋官方名稱、Stat、Mode 或 Part 關係
- [ ] 更新支援每週排程與手動觸發
- [ ] 失敗時保留最後成功資料並輸出錯誤摘要
- [ ] 來源 fixture 到 Part repository 的 ingestion contract 測試通過
