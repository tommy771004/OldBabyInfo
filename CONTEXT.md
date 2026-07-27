# OldBabyInfo

台灣的 Beyblade X 查詢工具與社群站。核心價值是「準」——把散落在各處的零件數據、賽事成績與商品資訊，整理成一個查得快、查得到、查得對的地方。討論不是獨立功能，而是附著在資料上的註解。

## 零件

**Part**：
戰鬥陀螺的單一可替換組件。是本站資料的最小單位。
_Avoid_: 配件、部品、component

**Blade**：
陀螺最上層的組件，決定攻擊形狀與大部分重量分布。UI 首次出現時可標註「刃」。
_Avoid_: 上蓋、刃、layer

**Ratchet**：
Blade 與 Bit 之間的組件，決定高度與齒數。UI 首次出現時可標註「齒」。
_Avoid_: 固鎖、齒輪、棘輪、disk

**Bit**：
陀螺最下層的接地組件，決定移動軌跡與持久特性。UI 首次出現時可標註「軸」。
_Avoid_: 軸心、軸尖、driver

**Stat**：
單一 Part 的五項數值之一：Attack、Defense、Stamina、X-Dash、Burst Resistance。來自官方資料，非本站評分。X-Dash 與 Burst Resistance 只存在於 Bit；Blade、Ratchet 只帶 Attack／Defense／Stamina。（04 號票驗證，見 [ADR-0007](docs/adr/0007-combo-stat-composition.md)。）
_Avoid_: 屬性、能力值、rating、四維

**Alias**：
同一個 Part 在現實中被叫到的其他名字——中譯、日文、俗稱、簡稱、常見錯字。搜尋必須全部命中。Alias 是本站最難被複製的資產。
_Avoid_: 別名、暱稱、tag

**Generation**：
陀螺的世代（Original Generation、Metal Fight、Burst、X）。Generation 是跨系統的第一層分類；每筆 Catalog entity 都帶此欄位。
_Avoid_: 系列、series

**System**：
同一 Generation 內定義可替換 Part 種類、陀螺組裝結構與相容規則的產品系統，例如 Plastic、HMS、Burst、BX、UX、CX。System 之間不可假設可以混裝。
_Avoid_: 世代、series

**Complete Beyblade**：
依某一 Generation／System 的正式結構，由多個 Parts 組成、可作為完整商品模型瀏覽的陀螺實體。它不是單一 Part，也不是販售時的 Release。中文介面一律稱「陀螺」——玩家講的就是這個字，「完整陀螺」是照英文直譯出來的說法，沒有人這樣講。
_Avoid_: 完整陀螺、stock combo、商品、build

**Release**：
官方販售的一個 SKU 或產品版本，可記錄區域、色彩、復刻、隨機款與組合內容，並透過關係指向 Complete Beyblade、Parts 或 Equipment；它不複製底層 Part。
_Avoid_: Part、Stock Listing

**Equipment**：
隨 Release 販售但不能進入 Combo 的用品，例如 Launcher、Stadium、Grip 或 Case。Equipment 仍是可搜尋的 Catalog entity。
_Avoid_: Part、配件

**Generation-scoped assembly**：
由 Generation 與 System 共同決定的陀螺組裝結構。X 的 Blade／Ratchet／Bit Combo 只是 X 系統規則，不得套用到 Burst、Metal Fight、Plastic 或 HMS。
_Avoid_: universal Combo、跨世代組裝

**Mold Batch**：
同一 Part、同一 Stat Edition 之下，不同生產批次間未見於官方數值的物理公差（模具磨損、材質批次），只能靠產品上的批號與玩家實戰歸納得知，官方不曾正式承認。與 Stat Edition（官方明文記載的數值版本差異）是兩件不同的事，來源與解析方式也不同：Mold Batch 只能從散文型社群文章用 LLM 抽取（35 號票）。
_Avoid_: 版本、revision、Stat Edition

**Stat Edition**：
同一 Part 在不同 SKU／復刻版之間，官方結構化資料明文記載的數值差異（例如 Dran Sword 標準版 Attack 55 vs 特別版 60，見 [ADR-0007](docs/adr/0007-combo-stat-composition.md)）。直接來自官方資料，決定性解析取得，不經 LLM。Part 的正式數值採最新／最普遍流通的 Stat Edition；其餘版本記錄為該 Part 的歷史，不另開一個 Part。
_Avoid_: 版本、revision、Mold Batch（物理公差，只能靠社群歸納，見上）

## 組裝

**Combo**：
一組 Blade + Ratchet + Bit 的完整搭配。是勝率統計與討論的主要對象。
_Avoid_: 配招、配置、build、setup

**Deck**：
三個 Combo 組成的一套出賽陣容。
_Avoid_: 牌組、隊伍、team

**Combo Style**：
玩家替特定 Combo 取的流派俗名（例如「眾生平等流」）。屬於 Alias 的一種，一樣要能被搜到。
_Avoid_: 流派、打法

## 賽事與統計

**Event**：
一場實際舉辦的賽事，有日期、地點、層級與參賽結果。
_Avoid_: 比賽、大會、tournament

**Event Tier**：
賽事的層級（GP、G1、G2、G3），代表規模與權重，與 Combo 的強弱無關。
_Avoid_: 等級、rank

**Meta Standing**：
由實際 Event 結果統計出的 Combo 表現：使用率、前八強佔比、奪冠次數，必附樣本數與統計期間。它只代表可計算的賽事結果，不包含外部作者或社群的主觀強度判斷。
_Avoid_: Tier List、主觀推薦、本站評分

**Sample Size**：
一則 Meta Standing 背後的實際賽事筆數。樣本不足時必須顯示「資料不足」，不得排名。
_Avoid_: 資料量、n

## 商品

**Stock Listing**：
某零售通路上某項商品的當下售價與庫存狀態，附抓取時間。是會過期的快照，不是權威資料。
_Avoid_: 商品、貨況、product

## 社群

**Subject**：
一則討論所附著的資料實體——一個 Part、一個 Combo、或一個 Event。本站沒有無主題的討論。
_Avoid_: 板、分類、topic

**Thread**：
掛在某個 Subject 之下的一串討論。
_Avoid_: 貼文、留言串

## 資料來源

**Field Authority**：
被指定可決定某一類資料欄位的來源權責。非權責來源仍可提供觀察與 Discovery Source，但不能覆蓋該欄位的正式值。
_Avoid_: 最後寫入者、來源優先序、fallback

**Source Document**：
具有 Publication Rights、可由 OldBabyInfo 保存並公開的完整來源內容。它保留原始文章結構，並作為其中所有 Assessment 的上下文。
_Avoid_: Assessment、Discovery Source、備份頁

**Assessment**：
單一來源對某個 Part 或 Combo 提出的主觀 Tier、推薦配置、打法或操作判斷。它必須連回 Source Document 或 Discovery Source，並帶有 Attribution Status。
_Avoid_: Meta Standing、官方 Stat、本站結論

**Evidence Source**：
實際承載一項主觀判斷的原始 LINE 貼文、LINE 訊息或影片。使用者必須能從它看見是誰在什麼語境下提出該判斷。
_Avoid_: 來源網站、彙整頁、轉貼頁、aggregator

**Discovery Source**：
協助本站找到一項資料的中介頁面，例如 BeybladeHub、HackMD 或其他彙整站。找不到 Evidence Source 時，資料仍可發布，但 Discovery Source 不能被冒充為原作者。
_Avoid_: Evidence Source、原始來源

**Source Excerpt**：
從非結構化文字抽取欄位時一併保留的原文片段。它可以來自 Evidence Source 或 Discovery Source；缺少原始 Evidence Source 不阻擋主觀資訊發布，但不得假裝已有原始作者背書。
_Avoid_: 引用、出處、citation

**Attribution Status**：
主觀資訊的來源歸屬狀態：有可定位 Evidence Source 時為 `attributed`，只有 Discovery Source 或找不到原始出處時為 `unattributed`。`unattributed` 仍可發布，但 UI 必須顯示「未附原始來源」。
_Avoid_: Needs Review、可信度、審核狀態

**Needs Review**：
交叉驗證結果不一致、或未通過值域檢查的資料，標記為此狀態，必須經人工判斷才能發布。
_Avoid_: 待確認、pending
