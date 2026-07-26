# 10 — BeybladeHub 權限閘門匯入

**What to build:** 維護者可匯入已取得相容權利的 BeybladeHub 資料，同時確保自動大量抓取在未獲許可時不會啟動。

**Blocked by:** 02 — 單一 Part Assessment tracer

**Status:** ready-for-agent

- [ ] 預設沒有 BeybladeHub 自動大量抓取排程
- [ ] 匯入必須帶取得方式、授權／許可與 capture metadata
- [ ] 權利不明的輸入拒絕全文，只允許另行判定的合法結構化事實
- [ ] Tier、推薦與打法只形成 Assessment，不覆蓋官方資料
- [ ] BeybladeHub 保持 Discovery Source 身分
- [ ] 權限閘門有允許與拒絕的外部行為測試
- [ ] 拒絕匯入不改動上一份成功資料
