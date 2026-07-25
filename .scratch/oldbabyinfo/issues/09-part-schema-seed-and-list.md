# 09 — Part schema + 種子資料 + 最小列表頁

**What to build:** 訪客能瀏覽一份完整的 Part 清單，看到每支零件的名稱與五項 Stat。

**Blocked by:** 02

**Status:** ready-for-agent — done, see Comments

落實 ADR-0001：資料以 repo 內 JSON 為單一真實來源，建置期靜態產生，完全不進資料庫。Stat 合成規則與五維定義見 [ADR-0007](../../../docs/adr/0007-combo-stat-composition.md)。

- [x] Part schema 定義完成，含 `generation` 欄位（本版恆為 X）；Stat 五項為 Attack／Defense／Stamina／X-Dash／Burst Resistance，後兩項只出現在 Bit
- [x] Part schema 容納 Stat Edition（官方數值版本，結構化來源、決定性解析）與 Mold Batch（物理公差，散文來源、LLM 抽取）兩個獨立子紀錄，不合併成同一欄位
- [x] 由官方 MasterData 建立種子資料，涵蓋現行所有 Blade、Ratchet、Bit；Part 正式數值取最新／最普遍流通的 Stat Edition
- [x] 資料檔通過 schema 驗證，驗證失敗會導致建置失敗
- [x] 列表頁以靜態生成產出，無資料庫查詢
- [x] 使用 CONTEXT.md 的詞彙：Part、Blade、Ratchet、Bit、Stat、Stat Edition、Mold Batch

## Comments

**領域問題已解決**：04 號票驗證 Combo 合成規則時發現，同一個 Part 名稱在官方資料裡可能對應多個版本、數值不同（例如 Dran Sword 標準版 55/25/20 vs 金銀銅特別版／最新復刻 60/30/25）。已用 `/domain-modeling` 拆成兩個詞——**Stat Edition**（官方明文記載的數值版本，結構化資料，決定性解析）與**Mold Batch**（原有定義不變，物理公差，只能靠散文與 LLM 抽取）。定義見 CONTEXT.md，推導過程見 ADR-0007。

### 實作摘要

- `src/lib/parts/schema.ts` — Zod schema，判別聯集（blade/ratchet/bit），Blade/Ratchet 三維、Bit 五維，`modes`／`statEditions`／`moldBatches` 各自獨立欄位。20 個 TDD 測試。
- `src/lib/parts/build-stat-editions.ts` — 純函式，從 MasterData 原始條目分離出 Stat Edition，正確處理 mode-change 排除、原始欄位名稱正規化（`dash`/`burst` → `xDash`/`burstResistance`）。5 個 TDD 測試。
- `scripts/generate-parts-seed.ts` — 一次性維護腳本（**不是** build 的一部分，手動執行 `npm run generate:parts`），以 beybrew 的 `beyparts.json`（社群已校正過的乾淨名稱＋標準數值）為準，交叉比對官方 `MasterData.json` 補上 Stat Edition 歷史。
- `src/lib/parts/repository.ts` — 在 module load 時用 `.parse()`（非 `.safeParse()`）驗證 `data/parts.json`，驗證失敗直接拋錯、建置中止。4 個測試，其中一個直接驗證真實種子資料量與 ADR-0007 手算過的 Dran Sword 數值。
- `src/app/[locale]/parts/page.tsx` — 最小列表頁，三語靜態產出，`● (SSG)` 確認無執行期查詢。

### 產出資料規模與已知落差

**168 個零件**（84 Blade／35 Ratchet／49 Bit），160 筆成功比對到官方 MasterData（有 Stat Edition 歷史），9 筆未比對到（維持 beyparts.json 的標準數值，但沒有版本歷史——安全的降級，不是資料錯誤）。

過程中修掉兩個真正的 bug：
1. 一開始比對邏輯除了精確比對 `group_id`，還有一個「model_name 子字串包含」的備援規則，對 `N`／`T`／`F` 這種單字母 Bit 代碼極度氾濫比對，把 23 個不同 Bit 誤判成同一個 id，靜默丟棄。改成只用 `group_id` 精確比對，寧可少匹配（降級為無版本歷史）也不要匹配錯（真零件消失）。
2. Stat 欄位一開始寫死 `z.int()`，但社群資料裡「5-70」這個 Ratchet 的 Defense/Stamina 是官方記載的半整數（8.5／9.5），改成允許非整數。

**已知的一筆真實碰撞**：`HellsHammer`（無空格）與 `Hells Hammer`（有空格）在 beyparts.json 裡是兩筆幾乎重複的條目，正規化後 id 相同。這是上游社群資料本身的品質問題，不是本站的抽取邏輯錯，目前保留第一筆、跳過第二筆並印出警告，未進一步深究。

**刻意留白，非漏做**：`nameJa`／`nameZhTw`／`aliases` 全部是空值（10 號票的範圍）；`moldBatches` 全部是空陣列（35 號票的範圍）。這是照 ADR-0001／ADR-0004 的分工，不是遺漏。
