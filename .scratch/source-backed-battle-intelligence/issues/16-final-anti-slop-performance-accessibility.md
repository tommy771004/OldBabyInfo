# 16 — 整站 anti-slop、效能與無障礙驗收

**What to build:** 使用者在所有公開路由都獲得完整、快速、可讀且一致的最終體驗，沒有 anti-slop 規範列出的視覺或互動缺陷。

**Blocked by:** 10 — BeybladeHub 權限閘門匯入；11 — Part 詳情五段完整旅程；12 — Parts、Compare、Combo 工作流改版；13 — Events 與 Meta 工作流改版；14 — Mold Batch 與 Where to Buy 工作流改版；15 — Discussion、Login、Terms 支援路由改版

**Status:** ready-for-agent

- [ ] 逐條重讀 AGENTS.md anti-slop 規範並記錄所有發現與修正
- [ ] 320、390、768、1024、1440 寬度無溢出、裁字、錯位或 edge-jammed copy
- [ ] 比較欄位、按鈕、圖示、標籤與數字完成數學及視覺置中檢查
- [ ] 所有真實產品圖保持正確比例，缺圖不產生假資產
- [ ] 所有文字通過所在表面的可讀對比，漸變 dead zone 不放內容
- [ ] 所有控制以實際 click 與鍵盤操作確認，不存在 dead controls
- [ ] reduced-motion 下所有資訊完整且沒有隱藏內容
- [ ] 無藍紫漸層、霓虹 glow、彩色粒子、浮動卡片、hover boop 或入口 opacity gate
- [ ] 主要公開旅程、typecheck、lint、單元／整合測試與 production build 全數通過
- [ ] 正式站與本機同 viewport 截圖並排檢查，修正可見 layout regression
