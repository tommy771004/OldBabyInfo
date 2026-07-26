# 戰鬥陀螺全世代分類與零件庫資料來源調查

調查日期：2026-07-26

## 結論

沒有單一仍在線、可公開匯入、又完整涵蓋所有世代的官方資料庫。

建議採用「官方來源定義真實分類與驗證紀錄，社群來源補齊舊世代全集」的混合策略：

1. 以 Takara Tomy 官方歷史頁建立四大世代及各 system 的分類骨架。
2. Burst 與 BEYBLADE X 直接以 Takara Tomy 商品頁、零件頁及說明書作主要匯入來源。
3. Plastic、HMS、Metal Fight 以 Hasbro 官方說明書和 Takara Tomy 歷史／新聞稿逐筆驗證。
4. 舊世代缺少的 SKU、零件與組成關係，由 Beyblade Wiki、Beywiki、PlasticsDB、HMSDB 補齊，但先標記為 `community_sourced` 或 `needs_review`。
5. Wikipedia 只適合確認四大世代、年份與高階概念，不適合作為零件或商品目錄來源。

## 建議的世代與 system 分類

頂層 `generation` 應使用官方認定的四大世代；HMS 是第一世代內一個與先前 Plastic 零件不相容的 system，不應誤列成第五個官方世代。

| generation | 建議顯示名稱 | system／子系統 |
| --- | --- | --- |
| `original` | 爆轉世代／Original Generation | Initial／4 Layer、Spin Gear、Magnacore、Engine Gear、GT、HMS |
| `metal_fight` | Metal Fight／Metal Saga | Metal／初期系列（社群常稱 Pre-HWS）、Hybrid Wheel、4D、Zero-G／Synchrome |
| `burst` | Beyblade Burst | Single、Dual、God、Cho-Z、Gatinko、Superking、Dynamite Battle、Burst Ultimate；Hasbro 的 SwitchStrike、SlingShock、HyperSphere、SpeedStorm、QuadDrive 等另存為區域 system |
| `x` | BEYBLADE X | BX／Basic Line、UX／Unique Line、CX／Custom Line，以及後續官方 line |

Takara Tomy 的[全世代官方歷史頁](https://beyblade.takaratomy.co.jp/history/index.html)及[英文版](https://beyblade.takaratomy.co.jp/history/en/index.html)明確涵蓋爆轉、HMS、Metal Fight、Burst、X，並說明主要 system 的結構變化。Takara Tomy 的[2023 年 BEYBLADE X 新聞稿](https://www.takaratomy.co.jp/product_release/pdf/p230517.pdf)則明確把爆轉、Metal Fight、Burst、X 稱為第 1 至第 4 世代。

## 第一方／官方來源

### 1. 全世代分類主來源：Takara Tomy 官方歷史

- URL：[BEYBLADE HISTORY 1999–2026](https://beyblade.takaratomy.co.jp/history/index.html)
- 涵蓋：全部四大世代、Plastic 系統演進、HMS、Metal Fight 各 system、Burst 各 system、X。
- 可取得：官方世代名稱、年份、system 名稱、結構變化及代表產品。
- 完整度：世代與 system 分類高；SKU 和零件清單低。
- 穩定性：高，為 Takara Tomy 靜態 HTML。
- 爬取適性：高；適合建立 `generation`、`system` 與時間線，不適合單獨產生完整零件庫。

官方歷史頁可直接確認：

- 初代曾依序出現 S、F、V、V2、Engine Gear、GT 與 HMS。
- HMS 將 Attack Ring 金屬化並縮小整體尺寸。
- Metal Fight 初期為 Face、Wheel、Track、Bottom 四層；Hybrid Wheel 再將 Wheel 拆成 Clear Wheel 與 Metal Wheel；後續有 4D。
- Burst 的 Layer 結構隨 Gatinko、Superking、Dynamite Battle 等 system 改變。
- X 繼承歷代特色並加入 X Dash。

### 2. Original／Plastic

#### Hasbro 官方說明書庫

- 入口：[Hasbro Product Instructions](https://instructions.hasbro.com/en-us)
- Plastic 範例：
  - [Bakushin-Oh](https://instructions.hasbro.com/en-us/instruction/beyblade-bakushin-oh-top)
  - [Rock Bison／Engine Gear](https://instructions.hasbro.com/en-us/instruction/beyblade-engine-gear-top-rock-bison)
  - [Torch Pegasus／Engine Gear](https://instructions.hasbro.com/en-us/instruction/beyblade-engine-gear-torch-pegasus-top)
  - [Bakushin-Oh 原始 PDF](https://www.hasbro.com/common/instruct/Beyblade_Tops_Bakushin-Oh.pdf)

Bakushin-Oh 說明書以組裝圖呈現 Bit Chip／Clear Cover、Attack Ring、Weight Disk、Spin Gear、Blade Base 等結構；Engine Gear 商品頁則能確認 Engine Gear system 的商品身分與配件。

- 完整度：低至中；仍在線的舊產品很多，但無可確認的完整 SKU 列表。
- 穩定性：中高；官方頁和 PDF 長期保留，但網址發現主要依搜尋。
- 爬取適性：中；HTML 有產品編號、名稱、簡介及 PDF，沒有已知公開批次 API。
- 命名注意：這是 Hasbro 區域版資料，不能直接覆蓋 Takara 日版名稱或產品編號。

### 3. HMS

#### Takara Tomy 歷史頁

[官方歷史頁](https://beyblade.takaratomy.co.jp/history/index.html)確認 HMS 於 2003 年推出，正式名稱為 Heavy Metal System，特徵是金屬 Attack Ring 與小型化。

#### Hasbro 官方說明書

- [Strata Dragoon MS](https://instructions.hasbro.com/en-us/instruction/hard-metal-system-strata-dragoon-ms-top)
- [Wyvern DJ 原始 PDF](https://www.hasbro.com/common/instruct/Beyblade_Grevolution_Wyvern_DJ_85421.pdf)

Wyvern DJ 說明書直接使用 Hard Metal System 名稱，並說明鋼製構件、低重心、雙向發射及 system 內零件互換。這些第一方資料可作 HMS 結構與相容性的正式證據。

- 完整度：低；適合驗證特定商品，不能當 HMS 全集。
- 穩定性：中高。
- 爬取適性：中；需逐 SKU 搜尋和解析 PDF。

### 4. Metal Fight／Metal Saga

#### Takara Tomy 官方分類證據

[官方歷史頁](https://beyblade.takaratomy.co.jp/history/index.html)記錄：

- 2008 初期系列：Face、Wheel、Track、Bottom。
- 2009 Hybrid Wheel System：Clear Wheel、Metal Wheel。
- 2011 4D System：包含 4D Bottom、可分割／模式切換的 Wheel。

[Zero-G 官方新聞稿](https://www.takaratomy.co.jp/product_release/pdf/p120321.pdf)可驗證 2012 年 Zero-G 系列的官方存在；[2008 年首發新聞稿](https://www.takaratomy.co.jp/product_release/pdf/p080708.pdf)可補早期 SKU，但新聞稿只列舉部分商品。

#### Hasbro 官方商品與說明書

- [Storm Pegasus](https://instructions.hasbro.com/en-gb/instruction/beyblade-metal-fusion-storm-pegasus)：明列 Face Bolt、Energy Ring、Fusion Wheel、Spin Track、Performance Tip，以及 BB28／105RF。
- [Spiral Blitz 2-Pack](https://instructions.hasbro.com/en-us/instruction/beyblade-metal-fusion-spiral-blitz-2-pack)：列出兩顆五件式陀螺與完整配置。
- [Gravity Demolition Force 2-Pack](https://instructions.hasbro.com/en-us/instruction/BeyBlade-Metal-Masters)：列出 Gravity Destroyer AD145WD 與 Inferno Byxis CH120RS。

- 完整度：中；Hasbro 的 Metal 商品仍有相當多官方頁，但沒有發現可枚舉的完整 Takara Tomy 舊商品目錄。
- 穩定性：中高。
- 爬取適性：中；HTML 結構明確但搜尋發現性差。
- 命名注意：Takara 的 Face／Clear Wheel／Metal Wheel／Track／Bottom 與 Hasbro 的 Face Bolt／Energy Ring／Fusion Wheel／Spin Track／Performance Tip 必須做來源別名映射，不應強行統一為單一「官方英文名」。

### 5. Beyblade Burst

Burst 是舊世代中官方線上資料最完整、最適合建立正式零件庫的一代。

#### Takara Tomy 商品總表

- URL：[Burst 商品情報](https://beyblade.takaratomy.co.jp/burst/products.html)
- 涵蓋：B-01 至 B-206、限定品、Random Booster、套組與周邊。
- 可取得：商品編號、商品類型、售價、完整陀螺、零件組成與部分相容性註記。
- 結構範圍：Layer／Disc／Driver，以及 Frame、Gatinko Chip／Weight／Base、Sparking Chip／Ring／Chassis、DB Core／Blade／Armor 等。
- 完整度：高。
- 穩定性：高，為保留的官方靜態頁。
- 爬取適性：高；可作 Burst `release` 和官方組成關係的主來源。

#### Takara Tomy 零件頁

- URL：[Burst Parts](https://beyblade.takaratomy.co.jp/burst/parts.html)
- 可取得：零件名稱、官方分類、類型及性能描述／數值。
- 完整度：中高。
- 爬取適性：中；頁面以 `?id=` 切換，實作前應確認零件資料是嵌入 HTML、JavaScript bundle 或個別端點，並保存抓取版本。

#### Takara Tomy 說明書

- 索引：[Burst WEB 說明書](https://beyblade.takaratomy.co.jp/burst/manual.html)
- PDF 範例：[B-205](https://beyblade.takaratomy.co.jp/burst/public_html/manual/pdf/b205_manual.pdf)
- 限制：官方索引自述主要提供 B-197 之後商品，因此不能把此索引誤當全 Burst 手冊庫。

### 6. BEYBLADE X

#### Takara Tomy 商品總表與單品頁

- 總表：[BEYBLADE X 製品情報](https://beyblade.takaratomy.co.jp/beyblade-x/lineup/)
- 單品範例：[BX-01 Dran Sword 3-60F](https://beyblade.takaratomy.co.jp/beyblade-x/lineup/bx01.html)
- 可取得：SKU、商品類型、完整陀螺名、價格、發售日、限定品／工具、部件詳細。
- 完整度：高且持續更新。
- 穩定性：高；單品頁網址穩定，但要把擷取日期和內容 hash 存入 provenance。
- 爬取適性：高；目前最適合建立 X `release`／SKU 的官方來源。

#### 結構與 line

- [GEAR STRUCTURE](https://beyblade.takaratomy.co.jp/gear/)：官方定義 Blade、Ratchet、Bit，並介紹 Basic／Unique／Custom Line。
- [初學指南](https://beyblade.takaratomy.co.jp/beyblade-x/guide/)：可交叉確認組裝與基本玩法。
- [CX Hasbro 商品範例](https://instructions.hasbro.com/en-us/instruction/bey-blade-bbx-fang-leon)：Hasbro 官方明確說明 CX Blade 可拆成三件，適合驗證區域版用語。

#### 說明書與規則

- [X 說明書總表](https://beyblade.takaratomy.co.jp/beyblade-x/manual/)：依 BX／UX／CX SKU 提供 PDF。
- [Takara Tomy 客服手冊／JAN 索引](https://www.takaratomy.co.jp/support/manual/beyblade/)：可補 JAN 與新 SKU。
- [官方大會 Regulation PDF](https://beyblade.takaratomy.co.jp/beyblade-x/_image/regulation.pdf)：可驗證對戰、Deck 與重複零件規則。

Regulation PDF 的網址會在原位置更新版本；匯入時必須記錄文件內版本、下載時間與檔案 hash，不能只保存 URL。

#### 官方 App 與 BeyBrew

- 官方 Android App：[Google Play：jp.co.takaratomy.beyblade](https://play.google.com/store/apps/details?id=jp.co.takaratomy.beyblade)
- 未找到 Takara Tomy 公開、受支持的 MasterData API 或 API 文件。
- 因此 BeyBrew 提取到的 MasterData 應標記為「官方 App 衍生資料」，而不是「官方公開 API」。
- 每次匯入應保存 App 版本、資料版本、檔案 hash、提取工具版本及原始欄位；若官方網頁／手冊衝突，先進待審區。

## 補充來源

### Wikipedia

- [Beyblade](https://en.wikipedia.org/wiki/Beyblade)
- [Beyblade franchise](https://en.wikipedia.org/wiki/Beyblade_%28franchise%29)

用途：

- 可快速確認四大世代、約略年份，以及各世代互不相容的高階說明。
- Burst 頁面有 Layer／Disc／Driver 與部分 subsystem 概覽。

限制：

- 沒有完整 SKU、配色、零件或組成關係。
- 內容以媒體 franchise 為主，玩具分類深度不足。
- 社群編輯會變動，不能凌駕官方來源。

授權與爬取：

- Wikipedia 文字使用 CC BY-SA；若複製或改寫受著作權保護的內容，需遵守署名與相同方式分享條款。
- 圖片不一定是自由授權，需逐檔檢查，不能跟文字一起批次搬入。
- MediaWiki API 穩定，技術上容易抓取，但資料深度不值得作零件庫主來源。

結論：只作 `generation`／年份的交叉驗證與來源導覽，不匯入零件資料。

### Beyblade Wiki（Fandom）

代表頁面：

- [Hard Metal System](https://beyblade.fandom.com/wiki/Hard_Metal_System)
- [Metal System parts](https://beyblade.fandom.com/wiki/List_of_Metal_System_parts)
- [4D System parts](https://beyblade.fandom.com/wiki/List_of_4D_System_parts)
- [Burst System](https://beyblade.fandom.com/wiki/Burst_System)
- [Burst System parts](https://beyblade.fandom.com/wiki/List_of_Burst_System_parts)

優點：

- 跨世代覆蓋最廣。
- 有 system、零件分類、完整陀螺、Takara／Hasbro 名稱與零件代碼。
- 表格、分類頁及 MediaWiki API 使其比一般網頁更適合半結構化匯入；MediaWiki 的[Categorymembers API](https://www.mediawiki.org/wiki/API%3ACategorymembers)可枚舉分類。

風險：

- 使用者編輯、結構不一致、部分頁面標示需要 cleanup。
- Wiki 自己維護了[長期錯誤清單](https://beyblade.fandom.com/wiki/Beyblade_Wiki%3ALongstanding_Misinformation)，證明舊稱呼與未驗證內容確實可能長期存在。
- 可作「候選全集」與別名來源，不應自動把內容提升為官方事實。

授權：

- Fandom 的[授權頁](https://www.fandom.com/licensing)說明 wiki 文字通常為 CC BY-SA 3.0；需要署名與 ShareAlike。
- 圖片不自動適用相同授權，依[Fandom Copyright 說明](https://community.fandom.com/wiki/Copyright)必須逐張檢查。

建議：透過 API 匯入名稱、分類和組成候選；原始頁 URL、revision id 與抓取時間必須保存；未有官方佐證者標記 `community_sourced`。

### Beywiki／World Beyblade Organization

- [Beyblade Product List](https://wiki.worldbeyblade.org/index.php?title=Beyblade_Product_List)
- [Beyblade Parts List](https://www.beywiki.com/index.php?title=Beyblade_Parts_List)
- [Heavy Metal System](https://wiki.worldbeyblade.org/index.php?title=Heavy_Metal_System)

優點：

- 對 Plastic、HMS、Metal Fight 的商品編號與原裝零件組合特別有價值。
- Parts List 同頁涵蓋 Plastic 的 4 Layer、A–F、V、V2、G、GT、HMS，以及 Metal、Hybrid Wheel、4D、Zero-G。
- MediaWiki HTML／API 技術上容易解析。

風險：

- 社群資料、部分內容多年未更新。
- 找不到清楚、可依賴的全站重用授權聲明；在授權釐清前，不應複製敘述或圖片。

建議：作舊世代「待驗證索引」，只擷取最小必要事實並回查官方說明書／包裝；保留頁面版本資訊。

### PlasticsDB

- [首頁與使用條款](https://www.plasticsdb.com/home)
- [Parts 分類](https://www.plasticsdb.com/parts)
- [Beyblade Parts List](https://www.plasticsdb.com/beyblade-parts-list)
- [完整陀螺列表](https://www.plasticsdb.com/beyblades)

優點：

- Plastic 世代專門資料庫，零件、原裝組合、模具差異、重量、照片與相容性深度優於一般 wiki。
- 作者說明 Parts 和 Beyblade entries 已完成，適合補舊世代缺口。

授權限制：

- 首頁明確允許作為 reference、要求 citation，且禁止未經同意重用圖片；並要求不要逐字複製。
- 因此只能把它當驗證／研究來源，若要自動匯入大批內容或圖片，應先取得作者明確授權。

爬取適性：頁面結構可抓，但授權約束使其不適合無授權的批次內容鏡像。

### HMSDB

- [HMSDB](https://www.hmsdb.com/)
- [Launchers and Accessories](https://www.hmsdb.com/launchers-and-accessories)
- [HMS Weight Comparison](https://www.hmsdb.com/hms-weight-comparison-doc)

優點：

- HMS 專門資料庫，宣稱以完整 HMS 零件實物與測試為基礎。
- 對零件來源、模具、重量與實戰用途非常有價值。

授權限制：

- 網站標示 © Daniel D. 2021，未發現允許批次重用的開放授權。
- 不應複製文字或圖片；適合作人工驗證或聯絡作者取得授權。

### 現有五個 X 來源

原本提供的五個來源仍應保留，但只作 X 世代來源：

1. [BeybladeHub](https://beybladehub.app/)：配置與社群型資料。
2. [Go-Shoot](https://go-shoot.github.io/x/)：中文詞彙、部件／組件拆分與實物觀察。
3. [HackMD 重要紀錄](https://hackmd.io/@liangyutw/beyblade-important-record)：中文社群紀錄與別名。
4. [BeyBrew](https://github.com/yujinyuz/beybrew)：官方 App 衍生 MasterData。
5. [Funbox 戰鬥陀螺分類](https://shop.funbox.com.tw/categories/XI/KB)：台灣販售商品、售價、庫存與商品網址。

這些來源不可推導 Plastic、HMS、Metal Fight 或 Burst 的全集。

## 建議的來源權重

| 權重 | 來源 | 可決定的欄位 |
| --- | --- | --- |
| 1 | Takara Tomy 官方商品／零件頁 | 日版 SKU、正式名稱、發售日、官方組成、system |
| 2 | Takara Tomy／Hasbro 官方 PDF 說明書 | 組裝結構、內容物、區域版名稱、產品編號 |
| 3 | Takara Tomy 官方歷史／新聞稿 | generation、system、推出年份、官方術語 |
| 4 | 官方 App 衍生 MasterData | 官方 App 內 ID、名稱、數值與組成候選；必須保存版本 |
| 5 | Fandom／Beywiki／PlasticsDB／HMSDB | 舊世代全集候選、別名、模具與缺漏關係 |
| 6 | Wikipedia | 世代與年份交叉驗證，不作零件主資料 |
| 7 | 商店／社群文章 | 地區商品、售價、庫存、俗名與實戰觀察 |

## 匯入與授權建議

每筆資料至少保存：

- `source_url`
- `source_kind`：`official_product`、`official_manual`、`official_history`、`official_app_derived`、`community_wiki`、`retailer`
- `source_region`：`JP`、`US`、`TW` 等
- `source_revision`／App 版本／文件版本
- `retrieved_at`
- `content_hash`
- `verification_status`：`officially_verified`、`cross_verified`、`community_sourced`、`needs_review`
- `license_note`

授權原則：

- 官方網站與手冊是權威來源，但通常仍受著作權保護；應擷取事實欄位，不要鏡像官方描述、照片、包裝圖或整份 PDF。
- Fandom／Wikipedia 文字可依各自 CC BY-SA 條款重用，但必須正確署名並處理 ShareAlike；圖片逐檔檢查。
- PlasticsDB 只允許引用且禁止未授權圖片重用；HMSDB 沒有找到開放授權。
- 對「資料事實」與「原文表達／圖片」分開處理，並在公開頁面提供來源連結。

## 實作優先順序

1. 先建立四大 `generation` 和各 `system`，用 Takara Tomy 歷史頁驗證。
2. 先完成 Burst 與 X 的官方匯入器，因為這兩代有近乎完整的官方商品頁。
3. 建立 Hasbro 說明書搜尋／匯入流程，逐筆補 Plastic、HMS、Metal Fight 區域版。
4. 用 Beyblade Wiki／Beywiki 產生舊世代候選全集，但預設不公開或顯示「待官方驗證」。
5. 以 PlasticsDB／HMSDB 人工審核疑難零件、模具與相容性，不做未授權鏡像。
6. Wikipedia 僅作頁面說明和世代時間線交叉驗證。

最重要的模型決策是：`generation`、`system`、`slot/component kind`、`beyblade model`、`release/SKU`、`regional naming` 必須分開。特別是 Hasbro 與 Takara 的名稱、Burst 的區域 system、以及同一完整陀螺的不同配色／再販，都不應被單一名稱欄位覆蓋。
