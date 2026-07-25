# 01 — Git repo 初始化並推上 GitHub private

**What to build:** 這個專案有一個私有的 GitHub 遠端，讓排程爬取與 PR 核可流程有地方運行。

**Blocked by:** None — can start immediately

**Status:** ready-for-human

需要人工執行互動式登入，agent 無法代勞。

- [ ] `gh` CLI 已安裝並完成 `gh auth login`
- [ ] 本地 `git init`，`.gitignore` 涵蓋 `node_modules`、`.env*`、`.next`、`.scratch` 視需要
- [ ] 建立 private repo 並推上首個 commit
- [ ] 確認 Actions 已啟用（private repo 免費額度 2000 分鐘／月）
- [ ] `OPENROUTER_API_KEY` 與 Neon 連線字串存為 repository secrets，未出現在任何 commit 中
