# 16 — 整站 anti-slop、效能與無障礙驗收

**What to build:** 使用者在所有公開路由都獲得完整、快速、可讀且一致的最終體驗，沒有 anti-slop 規範列出的視覺或互動缺陷。

**Blocked by:** 10 — BeybladeHub 權限閘門匯入；11 — Part 詳情五段完整旅程；12 — Parts、Compare、Combo 工作流改版；13 — Events 與 Meta 工作流改版；14 — Mold Batch 與 Where to Buy 工作流改版；15 — Discussion、Login、Terms 支援路由改版

**Status:** in-progress

- [x] 逐條重讀全域 anti-slop 設計法（`~/.claude/CLAUDE.md`）並記錄所有發現與修正
- [ ] 320、390、768、1024、1440 寬度無溢出、裁字、錯位或 edge-jammed copy
- [ ] 比較欄位、按鈕、圖示、標籤與數字完成數學及視覺置中檢查
- [ ] 所有真實產品圖保持正確比例，缺圖不產生假資產
- [ ] 所有文字通過所在表面的可讀對比，漸變 dead zone 不放內容
- [ ] 所有控制以實際 click 與鍵盤操作確認，不存在 dead controls
- [ ] reduced-motion 下所有資訊完整且沒有隱藏內容
- [x] 無藍紫漸層、霓虹 glow、彩色粒子、浮動卡片、hover boop 或入口 opacity gate
- [x] 主要公開旅程、typecheck、lint、單元／整合測試與 production build 全數通過
- [ ] 正式站與本機同 viewport 截圖並排檢查，修正可見 layout regression

## Progress

- Re-read the supplied anti-slop law through its final line while reviewing the changed surfaces. The implementation keeps content visible by default, uses the warm iron/clay palette, avoids neon/purple treatments and hover boops, preserves product image aspect ratios, and keeps the Assessment／Official／Stock data families visually separate.
- Added `src/lib/design/anti-slop-contract.test.ts` to enforce the public CSS constraints for hidden-content gates, blur/glow/lift treatments, warm-palette contrast, and reduced-motion fallback. The battle trajectory now has one authored moving current segment and disables that animation under reduced motion without hiding any content.
- The battle search now exposes its result list through `aria-autocomplete`, `aria-controls` and `aria-expanded`, and supports ArrowDown／ArrowUp／Enter／Escape selection from the combobox. Mold Batch lookup announces empty and matched states through a status region. Both behaviors have component-level tests.
- Current automated evidence: 74 test files / 330 tests passed, lint passed, typecheck passed, production build passed, the community-source policy gate passed, and the public five-stage contract passed for `zh-TW`, `en` and `ja`. Local HTTP smoke covers all primary public routes plus Parts compare, Combo, Guides and Mold Batch, as well as the Part detail query journey. It now also checks every public response for a `main` landmark, `h1`, document language, labelled form controls and explicit button types. Parts live search now has component-level match／empty-state coverage, source-backed abbreviation selection and explicit column scopes; Mold Batch guidance, the Go-Shoot V2 weight observation and source-backed Go-Shoot aliases have schema/importer, component and rendered HTML contracts.
- The HTTP contract is intentionally narrower than browser evidence: it verifies server-rendered structure and links, not keyboard activation, computed layout, contrast pixels or reduced-motion rendering.
- The remaining screenshot/breakpoint comparison item is not claimed: the browser skill was invoked, its troubleshooting guidance was followed, and the runtime reported no available browsers (`agent.browsers.list()` returned `[]`). Visual verification at 320/390/768/1024/1440 and side-by-side deployed comparison still needs a browser-enabled pass.
