# 07 — 競技場俯視 SVG（signature artifact 本體）

**What to build:** 本站的招牌視覺物件——一個精細手繪的俯視競技場圓盤，具備同心衝擊區、脊線與發射位，足以單獨撐起首屏。

**Blocked by:** 02

**Status:** ready-for-agent — done, see Comments

這是 ADR-0006 所稱「一個世界」的核心物件，其幾何語彙後續會被全站重複使用。

- [x] 以手繪向量完成，非 CSS 圖形拼湊（純 SVG path／circle／line，由幾何常數與弧線數學算出，非 `border-radius` div 堆疊）
- [x] 同心圓、脊線、發射位等結構清晰可辨，具真實的場地資訊而非裝飾圖案（見 Comments，每個元素對應官方場地的真實結構）
- [x] 不使用發光、漸層填充或粒子（純線條，`fill="none"`，只有描邊）
- [x] 於各主要斷點下皆完整可見，不被容器裁切（viewBox 縮放，結構性保證，非逐斷點測試——見 Comments）
- [x] 匯出其幾何常數（半徑比例、角度）供後續元件沿用，確保全站幾何一致（`src/lib/stadium-geometry.ts`）

## Comments

### 設計依據：真實場地結構，不是憑空畫的同心圓

查證過官方 Beyblade X Stadium 的實際構造（[Xtreme Stadium](https://beyblade.fandom.com/wiki/Xtreme_Stadium)、[Tornado Ridge 討論](https://worldbeyblade.org/Thread-The-Tornado-Ridge-height-in-select-stadiums)）：真實場地是**方形外殼包圓形碗**，內有一圈稱為「Tornado Ridge」的凸脊，出口**只在單一側**、不對稱——中間一個較寬的「Xtreme Zone」（3 分）夾兩個較窄的「Over Zone」（2 分）。這個不對稱缺口是這次設計採用的核心差異化——一般的「同心圓裝飾圖」都是對稱的，真實場地不是，這正好符合「具真實場地資訊而非裝飾圖案」這條要求的字面意義。

結構對應：
- 方形外殼（`rect` with `rx`）＝ Stadium 外殼
- 碗壁（三段弧線，非完整圓）＝ 碗的邊界，缺口處是出口
- 出口缺口＝ Xtreme Zone（寬）＋ 兩個 Over Zone（窄），角度不對稱地集中在一側
- 出口引道線＝ 從碗壁延伸到外殼邊緣的實體通道
- 虛線圓環＝ Tornado Ridge（用虛線而非實線，暗示這是「隆起的脊」而非另一道牆）
- 中心實心小圓＋圓點＝ Stamina Pocket（持久戰決勝的中心淺凹）
- 四個強調色刻度＝ 發射位，避開出口缺口均勻分布

### 幾何與弧線數學

`src/lib/stadium-geometry.ts`：所有半徑正規化為外殼半徑＝1 的比例（`bowlRadius`、`tornadoRidgeRadius`、`staminaPocketRadius` 皆為比例值），角度以度數表示；`src/lib/svg-arc.ts`：`polarPoint`／`arcPath` 純函式，把角度轉成 SVG 弧線路徑。兩個模組共 9 個測試，包含「半徑由內到外遞增」「出口缺口是單側、非對稱」「發射位避開出口缺口」這幾條協助鎖住設計意圖、防止日後改動時破壞真實比例的不變量測試。

### 視覺驗證

用 Playwright 截圖驗證，不是只看程式碼：大尺寸（640px）與小尺寸（220px）並排確認縮放正常；放大檢查缺口區域確認轉角圓滑、Xtreme Zone 確實比 Over Zone 寬、無斷裂；放大檢查中心點確認 Stamina Pocket 圓點與圓圈同心（兩者共用同一組座標，數學上保證正確）。截圖已傳給你。

「不被容器裁切」這條沒有逐一測試每個斷點寬度，而是靠 SVG `viewBox` 縮放的結構性保證——只要容器給的是合法寬度，內容永遠等比縮放、不會裁切，這是 SVG 這個技術本身的性質，不是需要每個尺寸各自驗證的東西。

### 已知留給後續票的事

- 05 號票發現的漸層中段文字禁區（ADR-0008）：這個 signature 目前是純線條，沒有任何文字疊加在上面，所以不受影響；但 39/40 號票若要在這個 signature 上疊加標籤或文字，要遵守那個限制。
- 目前只有一種呈色（`var(--ink-on-dark)` 描邊、`var(--accent-on-dark)` 發射位）。用在「場邊」暖端背景時，需要另外接上 `ink-on-light`／`accent-on-light` 變體（很小的改動，等實際頁面需要時再做）。
