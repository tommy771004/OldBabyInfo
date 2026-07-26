# 29 — 全站最新討論聚合頁

**What to build:** 一個入口，讓使用者看到全站最近有人在哪些零件、Combo 與賽事下面講話。

**Blocked by:** 28

**Status:** ready-for-agent

這是討論功能唯一的入口，取代傳統論壇首頁。

- [x] 依時間彙整各 Subject 下的最新 Thread
- [x] 每則顯示其所屬 Subject，點擊回到該資料頁的討論位置
- [x] 可依 Subject 類型篩選
- [x] 全站尚無討論時的狀態經過設計，不呈現空白版面

## Comments

`latestThreadsBySubject` 與 `DiscussionFeed` 已由測試覆蓋，篩選是可實際操作的 select，空
狀態也有邀請文案。頁面目前以空資料明確呈現，因為 28 號票的發文與全站 live reader 尚未
接入，不把靜態空陣列誤稱為已經有真實討論資料。
