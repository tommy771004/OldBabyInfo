# 08 — HackMD Assessment 匯入

**What to build:** 使用者能在相關 Part／Combo 中看見由 HackMD 發現的推薦 Combo、打法、重量與 Event 線索，而且知道它是 Discovery Source。

**Blocked by:** 02 — 單一 Part Assessment tracer

**Status:** in-progress

- [x] 推薦 Combo、打法與重量觀察寫入對應 Assessment 類型
- [ ] Event 線索連回原始 Event 試算表，不讓彙整頁覆蓋 Event 正式值
- [x] HackMD 被記錄為 Discovery Source，不被冒充為原作者
- [x] 找得到原始影片／LINE 時另存為 Evidence Source
- [x] 找不到 Evidence Source 時顯示「未附原始來源」
- [x] 未取得 Publication Rights 時不鏡像全文
- [ ] 每週排程與手動觸發只在取得方式符合來源條款時啟用
- [x] fixture 測試涵蓋 attributed、unattributed 與無法匹配 Subject

## Progress

- `src/lib/assessments/hackmd-import.ts` imports curated structured facts and short excerpts, emits Needs Review for unknown subjects, and fixes HackMD as Discovery Source. It preserves optional video／LINE Evidence Source without inventing attribution.
- The public Assessment repository and tracer already expose the imported shape and the no-Evidence state.
- Full-text mirroring and a recurring fetch workflow remain intentionally disabled until the acquisition method and Publication Rights are recorded; the current static file contains only the reviewed structured fixture.
