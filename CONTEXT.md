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
陀螺的世代（X、Burst、Metal Fight…）。目前僅收錄 X，但每筆 Part 都帶此欄位。
_Avoid_: 系列、series

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
由實際 Event 結果統計出的 Combo 表現：使用率、前八強佔比、奪冠次數，必附樣本數與統計期間。本站不發布主觀強度分級。
_Avoid_: Tier List、強度榜、排行、T0/S級

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

**Source Excerpt**：
由語言模型從非結構化文字抽取欄位時，必須一併保留的原文片段與出處連結。沒有 Source Excerpt 的抽取結果一律拒收。
_Avoid_: 引用、出處、citation

**Needs Review**：
交叉驗證結果不一致、或未通過值域檢查的資料，標記為此狀態，必須經人工判斷才能發布。
_Avoid_: 待確認、pending
