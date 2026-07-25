# Combo 的五維數值合成規則

Combo 的整體數值不是「三個零件的數值全部相加」這麼單純，直接看官方資料與現行社群工具的原始碼才能確認正確規則（04 號票，賽事資料 spike 之後的第二個 research spike）。

## 規則

- **Attack、Defense、Stamina**：跨零件加總——Blade + Ratchet + Bit（若有 Assist Blade / Over Blade，一併加總）。缺席的零件視為 0，不是報錯。
- **X-Dash、Burst Resistance**：只吃 **Bit** 的數值，不與其他零件加總。Blade 與 Ratchet 在官方資料裡這兩個欄位本來就不存在／恆為 0。
- **重量**：官方 App 原始資料（`defaultStatus.weight`）裡確實有這個欄位，但抽樣 9 個零件（3 Blade + 3 Ratchet + 3 Bit）全部是 0——數位資料裡沒有真正的物理重量。若本站要做「重量」相關功能，需另找資料來源（包裝標示、實測），不能從這份資料算出來。
- **Mode 變體**：有 `modes` 的 Blade／Bit，其數值是「以 mode 專屬數值覆蓋預設值」，不是額外疊加。Ratchet 在現行資料中沒有 mode 概念。

## 驗證方式

不是憑印象，是三組獨立來源交叉核對：

1. 直接讀 beybrew（社群 deck builder）的 `src/lib/comboUtils.js` 原始碼，取得公式本身。
2. 直接解析 beybrew 附帶的 `MasterData.json`——這是從官方 Beyblade X App 拆出來的原始資料（非社群整理過的版本）。
3. 用官方原始數值手算三組完整 Combo（Wizard Arrow/4-60/Ball、Shark Edge/9-80/Taper，另加下方 Dran Sword 案例），驗證公式套用後與 beybrew 呈現的結果一致。

## 意外發現：同名 Part 在不同版本間數值不同

驗證 Dran Sword 時，官方資料顯示同一個名字底下有 14 個不同 SKU，數值分兩群：標準版（BX-01/07/14/17/12 系列）Attack=55／Defense=25／Stamina=20；金銀銅特別版與 2026 年最新復刻（BXC00／BXC03／BXG52 等）Attack=60／Defense=30／Stamina=25。這不是資料錯誤，是官方在不同 SKU 間真的調整過數值，且明文記載在結構化資料裡。

**已用 /domain-modeling 談清楚並拆成兩個詞**（見 CONTEXT.md）：

- **Stat Edition**（新詞）——這裡看到的現象。官方結構化資料明文記載，決定性解析取得，不經 LLM。Part 的正式數值取最新／最普遍流通的 Stat Edition，較舊版本記錄為歷史，不另開 Part。
- **Mold Batch**（沿用原定義，不變）——未見於官方數值、只能靠批號與玩家實戰歸納的物理公差，來源是散文型社群文章（35 號票用 LLM 抽取）。

兩者資料來源與解析方式完全不同，這也是拆開的實質理由，不只是措辭潔癖：Stat Edition 走 ADR-0004 的「結構化來源禁用 LLM」分支，Mold Batch 走「散文來源允許 LLM」分支。混在同一個詞底下，09 號票的 schema 會分不清楚該給哪個欄位配哪種 pipeline。

## Consequences

- 組合建構器（18 號票）直接套用此公式，Attack/Defense/Stamina 用加總、X-Dash/Burst Resistance 只讀 Bit。
- Part schema（09 號票）不需要 weight 欄位對應官方數位資料——若要顯示重量，需另外決定資料來源。
- Part schema 需要同時容納 Stat Edition（結構化、決定性解析）與 Mold Batch（散文、LLM 抽取）兩個獨立子紀錄，兩者不可合併成一個欄位。
