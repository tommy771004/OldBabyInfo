# 12 — Parts、Compare、Combo 工作流改版

**What to build:** 使用者能在一致的戰鬥資料介面中搜尋 Parts、比較官方差異並建立 Combo，不需要在不同視覺系統間切換。

**Blocked by:** 01 — 首頁對戰搜尋與視覺基座；05 — BeyBrew 官方資料更新

**Status:** done

- [x] Parts 列表是高密度、可掃描的資料列表，不是卡片牆
- [x] 中文、日文、英文與 Alias 搜尋行為在首頁與 Parts 一致
- [x] Compare 對應欄位共享水平基線，缺值保留欄位位置
- [x] Combo Builder 使用 Blade、Ratchet、Bit 的真實關係與 Stat 組合規則
- [x] Part 代表色只出現在剪影、軌跡或變化值
- [x] 所有篩選、排序、選擇與清除控制都可實際操作
- [x] 窄螢幕比較可水平瀏覽且不裁切欄名或數值
- [x] 測試涵蓋跨語言搜尋、比較對齊與 Combo 數值變化

## Evidence

- Parts remains a dense semantic table with URL-backed type filters and sort links; its client search uses the same cross-language／alias `searchParts()` seam as homepage search.
- Compare uses a fixed table layout with reserved empty cells and horizontal overflow on narrow screens, so corresponding rows stay aligned.
- Combo Builder preserves the real Blade／Ratchet／Bit slot types and `computeComboStats()` values; existing compare/combo/search tests cover selection, clearing, localization and stat deltas.
