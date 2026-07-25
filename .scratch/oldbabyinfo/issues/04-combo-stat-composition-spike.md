# 04 — Combo 合成規則 spike

**What to build:** 一份說明 Blade + Ratchet + Bit 的四項 Stat 如何合成為 Combo 整體數值的規則文件，足以直接據以實作。

**Blocked by:** None — can start immediately

**Status:** ready-for-agent — done, see Comments

目前無人知道正確規則。未釐清前，組合建構器無法動工。

- [x] 查明官方資料中的合成方式：單純相加、加權、或存在交互作用
- [x] 確認是否有 mode 變體（多形態零件）影響合成結果
- [x] 確認重量是否獨立於四維另行合計
- [x] 以既有社群工具的計算結果交叉驗證至少三組 Combo
- [x] 產出可直接實作的規則描述；若規則本身存在爭議，記錄爭議點與本站採用的口徑

## Comments

規則與推導方式見 [ADR-0007](../../../docs/adr/0007-combo-stat-composition.md)。這裡記錄三組手算驗證案例，數值全部取自官方 `MasterData.json` 的 `defaultStatus`（非社群二次整理版本）：

**案例 1 — Dran Sword + 3-60 + Flat**（beybrew 自己的測試案例，見 `comboUtils.test.js`）
- Dran Sword（取最新版本）atk60/def30/sta25，3-60 atk15/def9/sta6，Flat atk40/def15/sta10/dash35/burst80
- 合成：Attack 115、Defense 54、Stamina 41、X-Dash 35、Burst 80

**案例 2 — Wizard Arrow + 4-60 + Ball**
- atk15/def30/sta55 ＋ atk11/def13/sta6 ＋ atk15/def25/sta50/dash10/burst30
- 合成：Attack 41、Defense 68、Stamina 111、X-Dash 10、Burst 30

**案例 3 — Shark Edge + 9-80 + Taper**
- atk65/def30/sta20 ＋ atk13/def10/sta7 ＋ atk35/def20/sta20/dash25/burst80
- 合成：Attack 113、Defense 60、Stamina 47、X-Dash 25、Burst 80

三組都用同一條規則（Attack/Defense/Stamina 加總、X-Dash/Burst Resistance 只讀 Bit）算出，且 Bit（Flat）與 Ratchet（3-60）的數值在 beybrew 資料與官方原始資料之間逐位元相符，驗證方式不是憑感覺。

**額外發現，不在原本票面範圍內**：CONTEXT.md 的 Stat 定義原本寫「四項數值」，實際是**五項**（多一個 X-Dash）——已修正 CONTEXT.md。另外驗證 Dran Sword 時意外發現同名 Part 在不同版本間數值不同（55/25/20 vs 60/30/25），這是 Mold Batch 概念的真實案例，但也讓 Mold Batch 現有定義（「模具差異」）出現措辭落差，已記在 ADR-0007，留給 09 號票用 /domain-modeling 處理。
