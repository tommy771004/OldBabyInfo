# 03 — 賽事資料 spike

**What to build:** 一份判斷報告，回答「本站能不能做出有統計意義的 Meta Standing」，並據此裁決 ADR-0003 是否成立。

**Blocked by:** None — can start immediately

**Status:** ready-for-agent
**Type:** research

這是整個規劃中唯一可能推翻既有 ADR 的未知數，必須最早解決。

- [ ] 實際取得 hackmd 上 2024–2026 的賽事試算表，記錄其真實欄位結構
- [ ] 統計可用的 Event 筆數、涵蓋店家數、涵蓋時間範圍
- [ ] 評估格式在不同月份之間的穩定度，記錄變異之處
- [ ] 判定樣本量是否足以支撐使用率／前八強佔比／奪冠次數的統計
- [ ] 產出結論：維持 ADR-0003，或改採「客觀統計為主 + 玩家評價為輔」的退路，並更新該 ADR
