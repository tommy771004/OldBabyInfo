# 28 — Thread 模型 + Part 頁討論

**What to build:** 登入後的使用者能在某支零件底下發表看法並閱讀他人的討論。

**Blocked by:** 16, 26

**Status:** ready-for-agent

落實 ADR-0002：本站沒有無主題的討論，每則 Thread 都錨定一個 Subject。

- [x] Thread 資料表就位，每則必須關聯一個 Subject
- [ ] Part 詳情頁可發文、可閱讀、可刪除自己的發言
- [x] 尚無討論時的狀態經過設計，讀起來像邀請而非故障
- [x] 發文有長度限制與基本的濫發防護
- [ ] 討論內容納入該頁的靜態渲染，可被搜尋引擎索引

## Comments

已完成 `threads` schema 的 subject foreign-key 形狀、公開可見資料 reader、Part detail 的
閱讀與空狀態，以及 2,000 字上限／cooldown domain rules。發文、刪除自己的發言、登入後
server action 與 live discussion feed 尚未接上，因此不把這張票標成全完成。
