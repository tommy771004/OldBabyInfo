# 08 — HackMD Assessment 匯入

**What to build:** 使用者能在相關 Part／Combo 中看見由 HackMD 發現的推薦 Combo、打法、重量與 Event 線索，而且知道它是 Discovery Source。

**Blocked by:** 02 — 單一 Part Assessment tracer

**Status:** ready-for-agent

- [ ] 推薦 Combo、打法與重量觀察寫入對應 Assessment 類型
- [ ] Event 線索連回原始 Event 試算表，不讓彙整頁覆蓋 Event 正式值
- [ ] HackMD 被記錄為 Discovery Source，不被冒充為原作者
- [ ] 找得到原始影片／LINE 時另存為 Evidence Source
- [ ] 找不到 Evidence Source 時顯示「未附原始來源」
- [ ] 未取得 Publication Rights 時不鏡像全文
- [ ] 每週排程與手動觸發只在取得方式符合來源條款時啟用
- [ ] fixture 測試涵蓋 attributed、unattributed 與無法匹配 Subject
