-- OldBabyInfo 的候選合作檔位。
-- ---------------------------------------------------------------------------
-- 對應調查：docs/research/affiliate-partner-candidates.md
-- 機制、模板與驗收查詢：scripts/sql/affiliates-seed.sql
--
-- 執行對象：SUP_DATABASE_URL 指向的共用資料庫。
--
-- 這份檔案的每一列都是「調查建議的對象」，不是「已經談成的合作」。
-- 所以三件事一律成立，不要改：
--
--   1. enabled 全部是 FALSE。三個關卡都過了才用第 4 節開啟：
--        a. Vercel 方案問題解決（Hobby 是非商業限定，見調查第 0.1 節）
--        b. 後台申請通過，拿到帶你追蹤碼的連結
--        c. 連結人工點過，確認不是過期頁、且與文案相符（規格 §8）
--
--   2. url 除了 KKday 以外，全部是 https://replace-me.invalid/<id> 這個哨兵值。
--      .invalid 是 RFC 2606 保留的 TLD，永遠不會解析到任何主機——所以它不可能
--      被誤認成真連結，也不可能誤導讀者到別的地方。我沒有、也不該有你的
--      追蹤連結：那只能從聯盟網後台產生。第 3 節有一支查詢專門抓還沒換掉的。
--
--   3. sponsored 全部是 FALSE。聯盟連結依你自己的 affiliate-setup.md 定義
--      屬於「合作推薦」；改成 TRUE 只有在真的收了錢做付費推廣時才成立。
--
-- 欄位對照：本站版位只顯示 partner（沒有才退回 title）。description 與
-- cta_label 是共用表的 NOT NULL 欄位，必須給值但本站不顯示，內容照調查
-- 第 0.2 節的結論寫給「家長」看，不是寫給孩子看。


-- ── 1. 候選檔位 ────────────────────────────────────────────────────────────
-- priority 直接對應調查的適配度排序：行 > 住 > 食。
-- 衣類沒有列進來，理由見調查第 5 節；真的要做的話在第 4 節。

INSERT INTO affiliates (
  project_name, id, enabled, sponsored,
  title, description, cta_label, url,
  icon, categories, crops, priority, partner, updated_at
)
VALUES
  -- ── 行 ──────────────────────────────────────────────────────────────────
  -- 賽事橫跨 21 個縣市。這裡刻意不放「查時刻表」——本站的「其他工具」已有
  -- Taiwanrail 與 TransitRail 免費做這件事，付費連結必須帶來它們沒有的東西。
  --
  -- 建立連結前必查：票券商品的「適用對象」。Klook／KKday 上不少交通優惠票
  -- 限外籍旅客購買，導台灣家長過去買不了就是規格 §8 說的文案不符。
  (
    'old-baby-info', 'a1-klook-rentcar', FALSE, FALSE,
    'Klook 租車・跨縣市賽事交通',
    '帶著孩子和整袋裝備跑外縣市，租車比轉乘實際。',
    '看租車方案',
    'https://replace-me.invalid/a1-klook-rentcar',
    NULL, ARRAY['all']::TEXT[], NULL, 8, 'Klook 客路', now()
  ),

  -- KKday 是唯一不必等後台審核的一列：CID 25570 用附加參數的方式生效，
  -- 來源是你自己的 TW_veggieprice- 專案 docs/affiliate-setup.md。
  --
  -- 網址形狀取自你 veggieprice 正式資料裡實際在用的那一筆（keyword 搜尋頁 +
  -- cid），所以形狀是有依據的。但 KKday 對自動化請求一律回 403，我無法確認
  -- keyword=租車 實際搜出什麼——**開啟前務必自己點開看過**。
  -- 你自己踩過的坑也適用：不要用動態關鍵字搜賽事相關詞（搜「陀螺」不會有
  -- 相關商品），確認過內容後建議改指向一個固定的商品頁。
  (
    'old-baby-info', 'kkday-rentcar', FALSE, FALSE,
    'KKday 租車・跨縣市賽事交通',
    '週末賽事跨縣市移動，租車帶裝備比較省事。',
    '看租車方案',
    'https://www.kkday.com/zh-tw/product/productlist?keyword=租車&cid=25570',
    NULL, ARRAY['all']::TEXT[], NULL, 7, 'KKday', now()
  ),

  -- ── 住 ──────────────────────────────────────────────────────────────────
  -- 宜蘭 16 場、嘉義 20 場、花蓮與台東各 4 場；高雄 173 場對北部讀者同理。
  -- 這些場次對外縣市家庭就是要過夜。
  -- Booking.com 也在聯盟網，與 agoda 擇一即可，看後台佣金決定，不必兩列都開。
  (
    'old-baby-info', 'a1-agoda', FALSE, FALSE,
    'agoda 訂房・外縣市賽事過夜',
    '跨縣市參賽的前一晚，先把親子房訂好。',
    '找住宿',
    'https://replace-me.invalid/a1-agoda',
    NULL, ARRAY['all']::TEXT[], NULL, 6, 'agoda', now()
  ),

  -- ── 食 ──────────────────────────────────────────────────────────────────
  -- 週末 14:00 開打、名額 32–48 人，一場是半個下午。
  -- Uber Eats 是整份調查風險最低的一列：已確認在聯盟網，而且你在
  -- veggieprice 已經有一組可用連結（a1-ubereats）。要只做一個檔位就做這個。
  (
    'old-baby-info', 'a1-ubereats', FALSE, FALSE,
    'Uber Eats・賽後直接送到家',
    '比完一個下午，不想再張羅晚餐就直接叫。',
    '叫 Uber Eats',
    'https://replace-me.invalid/a1-ubereats',
    NULL, ARRAY['all']::TEXT[], NULL, 5, 'Uber Eats', now()
  ),
  (
    'old-baby-info', 'a1-carrefour', FALSE, FALSE,
    '家樂福・賽前補給',
    '水、零食、折疊椅，出發前一次備齊。',
    '去家樂福',
    'https://replace-me.invalid/a1-carrefour',
    NULL, ARRAY['all']::TEXT[], NULL, 4, '家樂福', now()
  ),
  (
    'old-baby-info', 'a1-pizzahut', FALSE, FALSE,
    'Pizza Hut・賽後慶功',
    '打完一輪，幫孩子和同場的朋友加個菜。',
    '訂披薩',
    'https://replace-me.invalid/a1-pizzahut',
    NULL, ARRAY['all']::TEXT[], NULL, 3, 'Pizza Hut', now()
  )
ON CONFLICT (project_name, id) DO UPDATE SET
  enabled     = EXCLUDED.enabled,
  sponsored   = EXCLUDED.sponsored,
  title       = EXCLUDED.title,
  description = EXCLUDED.description,
  cta_label   = EXCLUDED.cta_label,
  url         = EXCLUDED.url,
  icon        = EXCLUDED.icon,
  categories  = EXCLUDED.categories,
  crops       = EXCLUDED.crops,
  priority    = EXCLUDED.priority,
  partner     = EXCLUDED.partner,
  updated_at  = now();


-- ── 2. 換上真連結 ──────────────────────────────────────────────────────────
-- 後台拿到帶追蹤碼的連結後，一列一列換。換完再開啟，不要一次全開——
-- 一次只上一個檔位，audit_log 的數據才歸得了因。
--
-- UPDATE affiliates
-- SET url = '從聯盟網後台複製的推廣連結', updated_at = now()
-- WHERE project_name = 'old-baby-info'
--   AND id = 'a1-ubereats';


-- ── 3. 還沒換掉哨兵值的檔位（開啟前必跑）────────────────────────────────────
-- 這支查詢是防呆：任何一列還帶著 replace-me.invalid 就代表連結還沒換，
-- 絕對不能開啟。應該在你換完之後回 0 列。

SELECT id, partner, url
FROM affiliates
WHERE project_name = 'old-baby-info'
  AND url LIKE '%replace-me.invalid%'
ORDER BY priority DESC, id ASC;

-- 更嚴格的一版：有沒有哪一列「已啟用但連結還是哨兵值」。
-- 這支任何時候都必須回 0 列；回了任何一列就是線上有壞掉的推廣連結。
SELECT id, partner, url
FROM affiliates
WHERE project_name = 'old-baby-info'
  AND enabled = TRUE
  AND url LIKE '%replace-me.invalid%';


-- ── 4. 開啟單一檔位 ────────────────────────────────────────────────────────
-- 三個關卡都過了再跑（見檔頭）。一次一列。
--
-- UPDATE affiliates
-- SET enabled = TRUE, updated_at = now()
-- WHERE project_name = 'old-baby-info'
--   AND id = 'a1-ubereats'
--   AND url NOT LIKE '%replace-me.invalid%';   -- 連結沒換就開不起來


-- ── 5. 衣類：調查建議先不做 ────────────────────────────────────────────────
-- 理由見 docs/research/affiliate-partner-candidates.md 第 5 節：陀螺不是運動
-- 項目，「比賽穿什麼」不是真需求，硬放 Nike 一眼就看得出在湊數。
-- Pinkoi 是唯一站得住的（客製名牌貼紙、陀螺收納袋這類周邊，是周邊不是衣著）。
-- 等版位有實際成效數據再決定要不要補這格；真的要做就取消下面的註解。
--
-- INSERT INTO affiliates (
--   project_name, id, enabled, sponsored,
--   title, description, cta_label, url,
--   icon, categories, crops, priority, partner, updated_at
-- )
-- VALUES (
--   'old-baby-info', 'a1-pinkoi', FALSE, FALSE,
--   'Pinkoi・客製周邊與收納',
--   '客製名牌、貼紙與收納袋，把孩子的零件整理好。',
--   '逛 Pinkoi',
--   'https://replace-me.invalid/a1-pinkoi',
--   NULL, ARRAY['all']::TEXT[], NULL, 2, 'Pinkoi', now()
-- )
-- ON CONFLICT (project_name, id) DO UPDATE SET
--   enabled     = EXCLUDED.enabled,
--   sponsored   = EXCLUDED.sponsored,
--   title       = EXCLUDED.title,
--   description = EXCLUDED.description,
--   cta_label   = EXCLUDED.cta_label,
--   url         = EXCLUDED.url,
--   icon        = EXCLUDED.icon,
--   categories  = EXCLUDED.categories,
--   crops       = EXCLUDED.crops,
--   priority    = EXCLUDED.priority,
--   partner     = EXCLUDED.partner,
--   updated_at  = now();


-- ── 6. 全部下架（緊急用）──────────────────────────────────────────────────
-- 只動本專案的資料列，不會碰到其他系統的。保留資料列，統計不會斷。
--
-- UPDATE affiliates
-- SET enabled = FALSE, updated_at = now()
-- WHERE project_name = 'old-baby-info';
