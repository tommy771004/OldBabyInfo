# LINE 登入設定

從零把 LINE Login 接上 OldBabyInfo 的完整步驟。程式端已經寫好
（[`src/lib/auth/line-provider.ts`](../src/lib/auth/line-provider.ts)），這份只處理
LINE Developers Console 的設定與環境變數。

Console 介面偶爾會改字，欄位名稱以官方文件為準：
<https://developers.line.biz/en/docs/line-login/getting-started/>

---

## 事前準備

- 一個 LINE 帳號（要能收簡訊驗證）
- 這個帳號需要綁定 **LINE Business ID**。第一次進 Console 會引導你建立
- 決定好正式站網域。本機開發用 `http://localhost:3000` 就好

---

## 1. 建立 Provider

Provider 是「誰提供這個服務」的擁有者單位，一個 Provider 底下可以掛多個
Channel。

1. 開 <https://developers.line.biz/console/> 並登入
2. 左側 **Providers** → **Create a new provider**
3. Provider name 填你的團隊或站名（例如 `OldBabyInfo`）

> Provider 名稱會出現在使用者的授權畫面上，取一個看得懂的。

---

## 2. 建立 LINE Login Channel

在剛才的 Provider 頁面按 **Create a new channel**，選 **LINE Login**，然後填：

| 欄位 | 填什麼 |
| --- | --- |
| Channel type | **LINE Login** |
| Provider | 上一步建立的 Provider |
| Region to provide the service | **Taiwan** |
| Company or owner's country or region | Taiwan |
| Channel name | 站名。**不能包含 "LINE" 或近似字**，會被退件 |
| Channel description | 一句話說明用途 |
| **App types** | **一定要勾 Web app** |
| Email address | 你的聯絡信箱（LINE 用來通知 Channel 異動） |
| Channel icon / Privacy policy URL / Terms of use URL | 選填 |

最後勾 LINE Developers Agreement 建立。

> **App types 沒勾 Web app 的話，下一步的 Callback URL 欄位不會出現。** 這是最常見的卡關點。

---

## 3. 設定 Callback URL

進入剛建立的 Channel → **LINE Login** 分頁 → **Callback URL**。

填入下列網址（一行一個，可以同時填多個）：

```
http://localhost:3000/api/auth/callback/line
https://你的正式網域/api/auth/callback/line
```

路徑固定是 `/api/auth/callback/line`，`line` 是
[`line-provider.ts`](../src/lib/auth/line-provider.ts) 裡的 provider id，不要改。

⚠️ **必須逐字相符**：scheme（http/https）、host、port、路徑任何一處不同都會在授權
後跳 `400 Bad Request` 或 `redirect_uri` 錯誤。用 `https://` 開的正式站不要填成
`http://`，也不要多一個結尾斜線。

---

## 4. 取得 Channel ID 與 Channel secret

同一個 Channel 的 **Basic settings** 分頁：

- **Channel ID** → 環境變數 `AUTH_LINE_ID`
- **Channel secret** → 環境變數 `AUTH_LINE_SECRET`（按 Issue／顯示後複製）

Channel secret 等同密碼。不要進 git、不要貼進 issue、外洩就在同一頁重新發行。

---

## 5. 填環境變數

複製 `.env.example` 成 `.env.local`（已被 `.gitignore` 忽略），填四個值：

```bash
# 產生 session 簽章金鑰
npx auth secret
```

```dotenv
AUTH_SECRET=剛才產生的值
AUTH_URL=http://localhost:3000

AUTH_LINE_ID=你的 Channel ID
AUTH_LINE_SECRET=你的 Channel secret
```

`AUTH_URL` 是 Auth.js 用來組出 callback 網址的來源，**必須和第 3 步登記的網域一
致**。正式站再加一個：

```dotenv
AUTH_URL=https://你的正式網域
AUTH_TRUST_HOST=true   # 站在 nginx / Cloudflare 等反向代理後面才需要
```

登入頁（`/login`）會自己判斷：`AUTH_SECRET` 加上任一組 provider 憑證齊全時才顯示
按鈕，缺了就顯示「登入功能尚未設定」，不會壞掉。

---

## 6. 本機測試

```bash
npm run dev
```

開 <http://localhost:3000/login> → 按「使用 LINE 繼續」→ 導向 LINE 授權頁 → 同意
後回到首頁，`/login` 會顯示「目前身分：你的 LINE 顯示名稱」。

**Channel 剛建立時狀態是 `Developing`，只有 Admin／Tester 角色的帳號能登入。**
自己測試時，請確認你登入 LINE 用的帳號，就是與開發者帳號綁定的那個 LINE 帳號
（不是用 Business ID 的帳密登入）。要讓其他人測，到 **Roles** 分頁把對方加成
Tester。

---

## 7. 上線

Basic settings 分頁把 Channel status 從 **Developing** 改成 **Published**，任何
LINE 使用者就都能登入。

⚠️ **這個動作不可逆**，改了就回不去 Developing。上線前先把 Callback URL、隱私權
政策連結都確認好。

---

## 這個站跟 LINE 要了什麼

只要 `profile` 一個 scope，拿到三樣東西：

| 欄位 | 用途 |
| --- | --- |
| `userId` | 帳號識別，寫進 session 的 `user.id` |
| `displayName` | 討論串顯示的作者名 |
| `pictureUrl` | 頭像 |

**沒有 email。** 要拿 email 得同時加 `openid` scope，並在 Basic settings 的
**Email address permission** 送出申請（需附同意畫面截圖，由 LINE 審核）。目前站上
沒有任何功能需要 email，所以連要都不要——這也讓實作不必驗證 `id_token`，繞開了
LINE discovery 文件寫 ES256、Auth.js 內建 provider 卻寫死 HS256 的分歧。細節寫在
[`line-provider.ts`](../src/lib/auth/line-provider.ts) 的註解。

---

## 卡關排查

| 症狀 | 原因 |
| --- | --- |
| Console 找不到 Callback URL 欄位 | 建立 Channel 時沒勾 **App types → Web app** |
| 授權後跳 `400 Bad Request` | Callback URL 沒逐字相符，或 `AUTH_URL` 與實際網域不同 |
| 回來後 `Configuration` 錯誤頁 | `AUTH_SECRET` 沒設 |
| 自己以外的人登不進去 | Channel 還在 `Developing`，對方不是 Tester |
| 正式站授權後回到 `localhost` | 正式環境的 `AUTH_URL` 沒改成正式網域 |
| 代理後面登入後 session 立刻消失 | 少了 `AUTH_TRUST_HOST=true` |
