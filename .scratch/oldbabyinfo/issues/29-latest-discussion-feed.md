# 29 — 全站最新討論聚合頁

**What to build:** 一個入口，讓使用者看到全站最近有人在哪些零件、Combo 與賽事下面講話。

**Blocked by:** 28

**Status:** ready-for-agent

這是討論功能唯一的入口，取代傳統論壇首頁。

- [x] 依時間彙整各 Subject 下的最新 Thread
- [ ] 每則顯示其所屬 Subject，點擊回到該資料頁的討論位置（Combo 可還原組合，Combo／Event 的討論定位仍待完成）
- [x] 可依 Subject 類型篩選
- [x] 全站尚無討論時的狀態經過設計，不呈現空白版面

## Comments

`latestThreadsBySubject` 與 `DiscussionFeed` 已由測試覆蓋，篩選是可實際操作的 select，空
狀態也有邀請文案。頁面已接入唯讀 Neon reader；未設定資料庫或讀取失敗時保持安全空狀態。

2026-09-05 修復 Combo Subject 遺漏：從實際可見 Thread 的穩定三零件 ID 解析描述，驗證
Blade／Ratchet／Bit 槽位，提供三語名稱與可還原全部槽位的 Combo Builder 連結。相同組合
只建立一個描述；隱藏、未知、舊名稱／slug 或格式錯誤的 subject 不猜測、不產生錯誤連結。

這是唯讀 feed 修復，不代表已啟用發文。Combo 連結目前指向組合建構器，Event 連結仍指向
賽事頁；兩者的討論區定位要在 #28 的相應 Subject 討論流程完成後接上，故保留該驗收項未勾選。
