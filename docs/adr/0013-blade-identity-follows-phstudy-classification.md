# Blade 身分改採 phstudy 的分類

`data/parts.json` 原本的 Blade 集合混入了 CX 的 MainBlade，並以 beybrew 的短名（`ARC`、`BRAVE`、`FANG`）作為身分；phstudy 則把同一批零件歸在 `BeybladePartsMainBlade`，而把 Blade 保留給完整的刀刃（`DRANARC`、`HELLSREAPER`）。兩種分類無法並存：同一顆物理零件會同時以兩個身分存在，破壞 ADR-0005 的「英文名為鍵」。自本決定起，X 世代 Blade 的身分以 phstudy 的 `group_id` 為準，CX 的 MainBlade／AssistBlade／LockChip 只存在於 Generation Catalog，不再進入 `parts.json`。

這同時是 ADR-0010 的例外授權：Blade 與 Ratchet 的 Field Authority 由 BeyBrew MasterData 移交 phstudy，範圍以各零件 provenance 中 phstudy 條目所列欄位為準。ADR-0010 其餘部分不變。

## 例外清單

上游的分類本身有瑕疵，以下例外逐筆列舉在 `scripts/phstudy-blade-vocabulary.ts`，不得以啟發式規則取代：

- `WARRIORSABER` 與 `SAMURAISABER`、`HELLSHUMMER` 與 `HELLSHAMMER` 是同一顆刀刃被拆成兩個 `group_id`（假名同為サムライセイバー、ヘルズハンマー）。折入策展 id。
- `BEYBLADEBURST` 是只有一個 SKU 的錯標群組，內容為 Storm Spriggan。折入 `STORMSPRIGGAN`。
- `CERBERUSDARKW`、`WHALEFLAMEM` 的 `group_id` 尾端黏了 CX 槽位字母，去除後才是身分。
- `BIT` 群組收的是「ビットセット」商品，屬於另一種零件，跳過。
- 81 筆 Blade SKU 上游沒有 `group_id`，幾乎全是 Hasbro 授權聯名（漫威、星戰、變形金剛、EVA）。它們是 SKU 層級商品而非零件身分，不進入 `parts.json`；`YELLKONG` 因此維持策展資料。

## id 改名的先例

`schema.ts` 註明 id「never renamed」。本決定明文破例兩次：`CROCCRUNCH` → `CROCOCRUNCH`、`TUSKMAMMOTH` → `MAMMOTHTUSK`，因為兩者是同一顆零件的拼字差異，保留兩份才是真正的傷害。破例僅限此清單，仍不是通則；未來的改名需要新的決定。

兩顆的 `nameEn` 維持策展值（`Croc Crunch`、`Tusk Mammoth`），所以詳情頁網址不變 —— id 是內部鍵，`slugify(nameEn)` 才是網址。

## 顯示名稱的來源

phstudy 沒有 Blade 的 `part_code_names.json`，其 `name` 欄位是 SKU 標籤（`BX-01 DRANSWORD`），而 ADR-0007 已記載本專案不從 SKU 標籤推導顯示名。因此：

- **英文**：既有策展零件沿用原名；新零件由詞彙表切分 `group_id`（X 的 Blade 名稱是「生物名＋主刃名」兩個詞）。詞彙多數由既有零件與 Generation Catalog 的 `main_blade` 記錄自動收集，其餘手寫於 `BLADE_NAME_TOKENS`，且**每一個都以片假名讀音核對**而非從拉丁字母猜測 —— 這正是 `HELLSHUMMER` 被判定為ヘルズハンマー（Hammer）、`WARRIORSABER` 被判定為サムライセイバー的依據。切不出來的零件會被回報，不會給出拼錯的名字。
- **日文／中文**：取自 phstudy 的 `name`，剝除 SKU 碼、色名與尾端槽位字母。既有零件的策展值與此完全一致，可交叉驗證。

## Consequences

- 17 顆 CX MainBlade 從 `parts.json` 移除，Generation Catalog 早已有這 17 筆 accepted 記錄，資料不減；`getLegacyPartForCatalogRecord` 對它們回傳 undefined，正是 `repository.test.ts` 既有斷言的行為。X 世代的 crosswalk 比對數因此由 168 降為 151。
- 這 17 個詳情頁網址改以 308 永久轉址指向各自的 Catalog 記錄頁。轉址表由合併腳本產出至 `data/legacy-part-redirects.json`（弄壞網址的人負責留下路標），`next.config.ts` 讀取後展開成無前綴與 `/ja`、`/en` 三種形式。腳本會拒絕輸出仍對應到現存零件的來源路徑。
- Blade 由 84 顆變為 103 顆，`parts.json` 總數 191。既有 Blade 的網址全部不變。
- 重跑 `npm run generate:parts` 會依 beybrew 重建並抹除以上全部，必須接著重跑 `npm run merge:phstudy`。合併是冪等的。
- 上游若新增無法切分的 Blade 名稱，合併會回報而非猜測，需要人工補一個詞彙條目。這是刻意的人工關卡，不是缺陷。
