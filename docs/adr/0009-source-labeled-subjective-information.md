# 允許主觀資訊，但每項判斷必須標注來源

OldBabyInfo 不再排除 Tier、推薦配置、操作建議等主觀資訊，因為台灣玩家真正需要的知識大量存在於 LINE 社群與影片中，只有客觀賽果會留下過大的資訊缺口。這些內容可以發布，但必須與官方 Stat、Stock Listing、Meta Standing 分開，並逐項保留原始發布者、Evidence Source、原文片段與資料時間；OldBabyInfo 負責忠實呈現來源的判斷，不把外部意見偽裝成本站或官方結論。

## Consequences

- 同一個 Part 或 Combo 可以同時有互相衝突的評價，介面必須讓使用者看見分歧，不能平均、投票或擅自合併成單一答案。排序先看 Attribution Status，`attributed` 優先，再以內容時間由新到舊排列。
- Meta Standing 仍只表示 Event 統計；S／A／B、推薦配置與打法判斷必須使用另一個領域名稱。
- 具有 Publication Rights 的完整內容保存為 Source Document；其中每一項 Tier、配置或打法判斷另抽成 Assessment，附著到對應 Part／Combo 並連回全文。
- BeybladeHub、HackMD 等彙整頁是 Discovery Source；有原始 LINE 貼文、LINE 訊息或影片時另外保存為 Evidence Source，不能把抓取網站冒充原作者。
- 缺少 Evidence Source 不阻擋發布。這類資料仍寫入 repo 內的靜態 JSON，Attribution Status 設為 `unattributed`，UI 以低調文字顯示「未附原始來源」；同時保留目前實際擁有的 Discovery Source 與片段，不得捏造原始作者。
