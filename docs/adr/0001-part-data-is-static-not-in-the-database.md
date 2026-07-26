# 零件資料靜態化，資料庫只服務討論與商品

零件資料是本站被讀取最頻繁的東西，但 Neon 免費方案會 scale-to-zero，冷啟動會讓第一位訪客等上數秒。因此 Part 資料完全不進資料庫，改以 repo 內的 JSON 為單一真實來源，在建置期產生靜態頁面；資料庫只承載真正需要即時寫入的兩件事：Thread 與 Stock Listing。

## Consequences

- 新增或修正一支 Part 需要重新建置部署，不是改一筆資料庫紀錄。這是刻意的——它讓每次資料變動都留下 git history 且可 revert。
- Cross-generation Catalog 仍以 repo JSON 為單一真實來源，但普通 Generation browse/detail route 只載入目前 Generation 的 accepted records；跨世代搜尋在伺服器端先篩選，再只傳搜尋結果。
- 2026-07-26 的測量為 1,942 筆 accepted records、1,172,555 bytes；最大單一 Generation 為 Burst 591,751 bytes，低於 650,000-byte regression budget，因此目前不需改用資料庫或重新開 ADR。
- 若任一 Generation payload 超過 650,000 bytes，`npm test` 的 payload budget assertion 會失敗，屆時必須重新評估此 ADR。
