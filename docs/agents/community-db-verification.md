# 社群資料庫驗證

2026-09-06 使用維護者提供的 Neon `DATABASE_URL` 完成連線與 schema 檢查。
目標資料庫已存在 `discussion.sql`、`auth-community.sql` 所需的資料表、欄位、
主要 CHECK／外鍵／唯一約束與帳號索引，因此本次沒有重建或重新套用正式 migration。
這是目前 schema 的觀察，不能反推 migration 的歷史執行時間。

## 可重跑驗證

本機 `.env.local` 儲存連線設定，應維持 Git 忽略且權限為 0600。不要把連線字串寫入本文件。

```sh
rtk proxy node --env-file=.env.local scripts/verify-community-db.ts --temporary-tables
```

腳本使用連線專屬的 PostgreSQL 暫存表，將兩份 migration 套用到隔離環境。
`search_path` 僅含 `pg_temp`，並在執行 repository 前確認所有測試表都是暫存表；
不讀寫正式帳號或討論。成功或失敗都會 ROLLBACK，連線關閉後暫存表消失。

本次通過的實際 repository 操作：

- 建立帳號、email 正規化查找、更新顯示名稱、綁定 OAuth 帳號及拒絕轉移歸屬。
- 發文及冷卻限制、拒絕刪除他人討論、檢舉與重複提交拒絕。
- 管理員讀取檢舉、隱藏討論、封鎖與解封；一般使用者不能執行管理操作。
- 本人軟刪除、封鎖後禁止發文、撤銷管理角色後拒絕管理操作。

## 尚未驗證

這不涵蓋多連線並發競態、正式資料寫入、Google／LINE 真實 OAuth 往返、
瀏覽器操作入口或遠端部署。OAuth 測試只驗證 adapter 的資料庫契約。
本次未建立正式管理員；`AUTH_DATABASE_ENABLED` 與 `COMMUNITY_WRITES_ENABLED`
維持 false。啟用前需完成真實登入、確認管理員身分，並接通及驗收操作介面。
