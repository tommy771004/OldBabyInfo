# 01 — Git repo 初始化並推上 GitHub private

**What to build:** 這個專案有一個私有的 GitHub 遠端，讓排程爬取與 PR 核可流程有地方運行。

**Blocked by:** None — can start immediately

**Status:** mostly done — user set this up directly (not via `gh`), two items unverified, see Comments

需要人工執行互動式登入，agent 無法代勞。

- [x] `git init`，`.gitignore` 涵蓋 `node_modules`、`.env*`、`.next`
- [x] 建立 private repo 並推上首個 commit（`origin` 指向 `github.com/tommy771004/OldBabyInfo`，未認證 API 存取回 404，確認為 private）
- [x] 已部署至 Vercel（使用者已確認，見對話紀錄）
- [ ] 確認 Actions 已啟用——**無法從這裡驗證**，未認證的 GitHub API 存取一律 404（因為是 private），需要使用者自己到 repo 的 Actions 分頁確認
- [ ] `OPENROUTER_API_KEY` 與 Neon 連線字串存為 repository secrets——**同上，無法驗證**，需要使用者自己到 repo Settings → Secrets 確認是否已設定

## Comments

repo 是使用者自己透過 GitHub 網頁／git 指令建立並持續在推送（7 次提交，`main` 與 `origin/main` 同步），不是透過 `gh` CLI（這裡環境沒有裝 `gh`）——殊途同歸，票面真正在意的是「有地方讓排程爬取與 PR 核可流程運行」，這件事已經成立。

**尚待使用者確認**（agent 沒有認證管道查證）：
1. `.github/workflows/ci.yml`（02 號票寫的）是否已經在 Actions 分頁真的跑過、是綠燈。
2. `OPENROUTER_API_KEY`、Neon 連線字串是否已存為 repository secrets——21／23／24／25 號票（爬蟲與 PR gate 管線）開工前需要這個。
