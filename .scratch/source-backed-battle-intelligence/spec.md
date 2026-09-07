# Source-backed Battle Intelligence 與整站改版

**Status:** ready-for-agent

## Problem Statement

台灣 Beyblade X 玩家需要在多個官方資料、社群文章、影片、LINE 討論、賽事試算表與零售通路之間往返，才能回答一個看似簡單的問題：某個 Part 的官方能力是什麼、玩家怎麼評價、有哪些推薦 Combo、不同來源為何有分歧、哪個 Mold Batch 或重量值得注意，以及現在到哪裡買。

OldBabyInfo 已經具備 Part、Combo、Event、Meta Standing、Mold Batch、Stock Listing 與 Discussion 的基礎功能，但目前尚未將主觀 Assessment、Evidence Source、Discovery Source、Source Document 與 Publication Rights 串成完整使用者旅程。現有首頁也仍以標題與 CTA 為主，沒有讓跨語言搜尋與競技場分析成為第一操作；其他公開路由的視覺與資訊層級仍不一致。

使用者需要一個準確、可追溯、能保留來源分歧，而且具有戰鬥熱血感的單一產品。資料來源不能因抓取順序互相覆蓋，找不到原始來源的社群資訊不能被假裝成官方結論，沒有公開權利的全文也不能被鏡像。

## Solution

OldBabyInfo 將提供一套 source-backed battle intelligence 體驗：

- 跨中文、日文、英文、Alias 與 Combo Style 搜尋 Part／Combo。
- 以 BeyBrew 所附官方 App MasterData 作為 Part 名稱、Stat、Mode 與關係的 Field Authority。
- 將 Tier、推薦 Combo、打法、重量與 Mold Batch 觀察保存為逐來源 Assessment。
- 同一 Subject 的衝突 Assessment 並列呈現，不平均、不投票、不合併成本站結論。
- 有 Evidence Source 時標示原作者與原始 LINE／影片；沒有時顯示「未附原始來源」並保留 Discovery Source。
- 只有具 Publication Rights 的內容才能公開為完整 Source Document。
- 由 Funbox 等實際通路提供 Stock Listing，由原始賽事試算表提供 Event。
- 以每日或每週排程維持不同資料家族的更新，來源失敗時保留最後成功資料。
- 以獲批准的第 3 個視覺方向為基礎，將跨語言搜尋、真實產品圖、競技場幾何、官方 Stat 與來源判斷組成同一個戰鬥分析介面。
- 將同一套暖黑／深鐵至陶土淺色、Taipei Sans TC／Combat 字體與銅白微電流語言延伸至所有公開路由。

## User Stories

1. As a 台灣玩家, I want to search a Part by its Chinese name, so that I can find it without knowing the official English name.
2. As a 台灣玩家, I want to search a Part by its Japanese name, so that I can use names seen in Japanese videos and packaging.
3. As a 台灣玩家, I want to search a Part by its English name, so that I can use the official international naming.
4. As a 台灣玩家, I want to search by Alias or common misspelling, so that community vocabulary still reaches the correct Part.
5. As a competitive player, I want to search a complete Combo, so that I can compare assembled battle subjects rather than isolated Parts.
6. As a player, I want my selected Part／Combo to appear in the stadium analysis, so that search and battle data feel like one task.
7. As a motion-sensitive user, I want a complete static stadium analysis, so that reduced motion never removes information.
8. As a keyboard user, I want to operate search, results, pagination and navigation without a pointer, so that the whole journey remains accessible.
9. As a player, I want official Stat and Mode shown before community opinion, so that I know which information is factual.
10. As a player, I want to see the real product image at its correct aspect ratio, so that I can identify the physical Part accurately.
11. As a player, I want a trustworthy silhouette when a real product image is unavailable, so that the page remains useful without inventing an asset.
12. As a player, I want to see every Stat that actually exists for the Part type, so that Blade／Ratchet are not forced into the Bit schema.
13. As a player, I want to see a source's Tier judgment, so that subjective strength opinions are available.
14. As a player, I want to see a source's recommended Combo, so that I can reproduce the configuration being discussed.
15. As a player, I want to read a source's tactic or operation advice, so that a recommendation includes how it should be played.
16. As a player, I want conflicting Assessment entries shown side by side, so that disagreement remains visible.
17. As a player, I want attributed Assessment entries before unattributed entries, so that the best-located evidence is easiest to inspect.
18. As a player, I want newer Assessment entries before older entries within the same attribution class, so that current observations are easier to find.
19. As a player, I want unattributed information labelled「未附原始來源」, so that absence of an Evidence Source is explicit.
20. As a player, I want an Assessment to retain its Discovery Source, so that I can inspect the page where OldBabyInfo found it.
21. As a player, I want an attributed Assessment to link to the original LINE item or video, so that I can inspect the actual context.
22. As a reader, I want a licensed Source Document to preserve the complete source structure, so that extracted judgments remain connected to their context.
23. As a rights holder, I want unlicensed full text excluded from public output, so that public readability is not mistaken for republication permission.
24. As a maintainer, I want every Source Document to record its licence or permission evidence, so that publication rights can be audited.
25. As a maintainer, I want Source Document content removable independently, so that a rights change does not corrupt unrelated structured facts.
26. As a player, I want to choose 5, 10, 15 or 20 Assessment entries per page, so that I can control reading density.
27. As a player, I want 10 Assessment entries per page by default, so that the initial page is useful without being overwhelming.
28. As a player, I want Assessment page and page size in the URL, so that refresh, back navigation and sharing preserve my position.
29. As a player, I want Mold Batch and weight observations after Assessment, so that physical variation is available without being mistaken for official Stat.
30. As a player, I want Stock Listing entries after Mold Batch information, so that buying is part of the same Part journey.
31. As a shopper, I want product name, price, availability, retailer and captured time, so that I can judge a retailer snapshot.
32. As a shopper, I want to open the retailer's original product page, so that OldBabyInfo never acts as the merchant.
33. As a shopper, I want only the captured time rather than a guessed stale badge, so that the interface does not invent certainty.
34. As a shopper, I want the last successful Stock Listing retained when a refresh fails, so that a transient failure does not erase the page.
35. As an Event attendee, I want current Event information from original spreadsheets, so that venue, time and registration data are traceable.
36. As a competitive player, I want Meta Standing to remain separate from Tier Assessment, so that computed results and subjective opinions are not conflated.
37. As a competitive player, I want Meta Standing to show period and Sample Size, so that rankings can be interpreted responsibly.
38. As a maintainer, I want official data refreshed weekly and on demand, so that MasterData changes can be incorporated predictably.
39. As a maintainer, I want Stock Listing and Event data refreshed daily, so that fast-changing data is updated at the right cadence.
40. As a maintainer, I want community sources refreshed weekly and on demand, so that slower-changing judgments do not require daily crawling.
41. As a maintainer, I want each source adapter limited to its own data family, so that a community page cannot overwrite official Stat.
42. As a maintainer, I want deterministic writes, so that identical input does not create duplicate records or noisy diffs.
43. As a maintainer, I want validation failures and Field Authority conflicts routed to Needs Review, so that bad data is not silently published.
44. As a maintainer, I want one source failure isolated from the other sources, so that a partial outage does not stop every refresh.
45. As a maintainer, I want each run to report source version, timing and accepted／skipped／error counts, so that scheduled work can be audited.
46. As a source operator, I want BeybladeHub automated mass scraping disabled until compatible permission exists, so that the product respects explicit source restrictions.
47. As a source operator, I want a rights-cleared manual input path for restricted sources, so that permitted information can still be imported.
48. As a visitor, I want the homepage to begin with battle search rather than a generic CTA, so that the product's main value is immediately usable.
49. As a visitor, I want real Part colors limited to product imagery, trajectories and changed values, so that the page remains visually disciplined.
50. As a visitor, I want battle energy expressed through rotation, collision, loss of speed and stat change, so that the design feels hot-blooded without neon effects.
51. As a visitor, I want microcurrent to appear only in response to interaction or collision, so that motion has meaning.
52. As a long-form reader, I want warm clay reading surfaces derived from the same palette as the stadium, so that the whole product feels coherent.
53. As a visitor, I want every public route to use the same visual system, so that moving between data, community and account pages does not feel like switching sites.
54. As a mobile user, I want search, Part identity and official Stat prioritized before secondary content, so that the main task works on a narrow screen.
55. As a comparison user, I want corresponding fields aligned across columns, so that variable copy length cannot create a ragged comparison.
56. As a visitor, I want content visible even when animation fails, so that screenshots, throttled tabs and unsupported browsers never show empty sections.
57. As a visitor, I want every visible control to work, so that tabs, filters, pagination and buttons never behave like static props.
58. As a discussion reader, I want Discussion to remain attached to a Part, Combo or Event Subject, so that comments retain data context.
59. As a signed-in user, I want Login to use the same design system as public data routes, so that account tasks do not feel bolted on.
60. As a reader, I want Terms and source rights information to be easy to read, so that product and publication boundaries are understandable.

## Implementation Decisions

- The approved visual target is the third generated direction, refined to remove residual pill treatments, decorative rules, unnecessary borders and generic control styling.
- The homepage primary interaction is cross-language Part／Combo search. Selecting battle subjects updates a data-driven Xtreme Stadium analysis rather than navigating through a CTA pair.
- The stadium remains a real data visualization based on the project's existing geometry. Real product photography is used when available; decorative approximate assets are not introduced.
- The global palette runs from warm black and deep iron to a clay-light reading end within one hue family. The middle contrast dead zone contains no text.
- Chinese display type uses Taipei Sans TC Bold. English names, Part codes and large numbers use Combat. Running text uses Taipei Sans TC Regular. Iansui is limited to occasional player quotations.
- Microcurrent is a thin, low-saturation copper-white interaction signal. It appears only on hover, focus, Combo Stat changes, stadium scroll relationships or collision.
- Part colors are scoped to their product image or silhouette, trajectory and changed Stat value. They do not become page themes.
- Content is visible by default. Motion is progressive enhancement and always respects `prefers-reduced-motion`.
- Motion is implemented with a tested animation engine for stateful or scroll-linked behavior, while simple tonal state changes may remain CSS. Motion must not gate content.
- Buttons do not translate, scale, glow or animate underlines. Cards do not receive a global hover lift.
- Official Part names, Stat, Mode and Part relationships come from BeyBrew's official-app-derived MasterData. Only structured facts and source version metadata are imported; unlicensed code and imagery are not copied.
- Part data remains static and repository-backed. Stock Listing remains dynamic and repository-backed through the existing database seam. Event and community-derived slow data remain deterministic static data.
- Funbox and other actual retailers are Field Authority for their own price, availability, product URL and captured time.
- Original Event spreadsheets are Field Authority for Event schedules and results.
- Community sources may produce Assessment, Alias, weight and Mold Batch observations, but cannot overwrite official Stat.
- Assessment is a single source's subjective judgment attached to one Part or Combo. Supported kinds include Tier, recommended Combo, tactic, weight and mold observation.
- Assessment sorting is attributed first, then newest by content time.
- Unattributed Assessment remains publishable and displays「未附原始來源」. It is not automatically Needs Review.
- Source Document is complete source content with Publication Rights. Each document records canonical source, publisher, capture time and licence or permission evidence.
- Missing Publication Rights blocks full-text publication but does not automatically block lawful structured facts or necessary short excerpts.
- Restricted sources use a permission-gated manual import path. BeybladeHub automated mass scraping remains disabled until explicit compatible permission exists.
- Stock Listing and Event refresh daily. BeyBrew and community information refresh weekly and support manual triggering.
- A failed refresh preserves the last successful dataset and emits a run report.
- Part detail follows one fixed sequence: official identity／image／Stat／Mode, Assessment, Mold Batch／weight, Where to Buy, Discussion.
- Assessment page size options are 5, 10, 15 and 20, with 10 as default.
- Assessment pagination state uses `assessmentPage` and `assessmentSize` URL query parameters. Invalid values fall back safely to defaults.
- Meta Standing remains computed Event performance with Sample Size and time period. It is never renamed or presented as Tier Assessment.
- All public routes are redesigned. Internal styleguide and visual demo routes remain internal QA surfaces.
- Discussion remains anchored to Subject. This effort restyles the existing account and discussion surfaces but does not add unrelated moderation or identity features.
- The first release remains non-commercial: no advertising, affiliate tracking or paid features.

## Testing Decisions

- Tests assert externally observable behavior rather than private functions, DOM structure, CSS class names or implementation-specific animation frames.
- Two high-level seams cover the feature:
  1. A source-ingestion contract seam takes a deterministic source fixture through parsing, Field Authority enforcement, rights checks, validation and publication. It asserts accepted, Needs Review and rejected outcomes, stable output, run reporting and retention of the last successful dataset.
  2. A public-journey seam opens the rendered product and verifies cross-language search, battle selection, official data, Assessment ordering and pagination, Source Document access, captured time, responsive behavior, keyboard operation and reduced motion.
- Source adapters share the ingestion contract seam rather than creating a separate testing architecture for each site.
- Parser fixtures contain realistic source shapes but no unlicensed mirrored full text.
- Existing data-writer tests are prior art for deterministic output, dry runs and separation of Needs Review records.
- Existing Stock Listing scraper tests are prior art for structured-first loading, fallback behavior, rate limiting and failure isolation.
- Existing Event ingestion diff tests are prior art for plausible dates, raw Source Excerpt retention and add／change／unchanged reports.
- Existing cross-language Part search tests are prior art for English, Japanese, Chinese, Alias, whitespace and partial matching.
- Existing Testing Library component tests are prior art for visible empty, loading and error states.
- Playwright is used for the approved end-to-end public journey and visual breakpoint checks. Screenshot comparison is evidence for layout QA, not the only assertion.
- Visual QA covers 320, 390, 768, 1024 and 1440 widths, with particular attention to clipped text, edge gutters, parallel-column alignment, real image aspect ratio and hard color seams.
- Accessibility QA covers semantic headings, labels, link purpose, focus visibility, keyboard order, contrast and `prefers-reduced-motion`.
- Every interactive control is exercised with a real click or keyboard action before completion.
- Final QA repeats the full anti-slop design law (`~/.claude/CLAUDE.md`, loaded into every session; not in this repo) and fixes every detected violation before the effort is considered complete. `src/lib/design/anti-slop-contract.test.ts` enforces the machine-checkable subset and must stay green.

## Out of Scope

- Advertising, affiliate tracking, paid subscriptions or any other commercial feature.
- Automated mass scraping of BeybladeHub without explicit compatible permission.
- Mirroring unlicensed articles, videos, LINE conversations, product descriptions or product images.
- Converting conflicting Assessment entries into a community vote, average score or OldBabyInfo Tier.
- Treating missing Evidence Source as Needs Review by default.
- Replacing official Stat with community observations.
- New authentication providers, account-merging behavior, moderation tools or unrelated Discussion capabilities.
- A free-standing forum with Threads that lack a Part, Combo or Event Subject.
- A redesign of internal styleguide, color-demo or stadium-demo routes as public product destinations.
- Blue-purple gradients, neon glow, colored particles, radial halos, decorative floating cards or generic SaaS page templates.

## Further Notes

- The production reference is `https://old-baby-info.vercel.app/`.
- The selected third visual direction is a target, not a pixel-perfect asset. Its radial comparison, search-first hierarchy, warm iron arena and clay reading strip are retained; its residual pill labels, decorative hairlines and excess borders are removed.
- Sources and rights can change. Each adapter must keep its acquisition mode and publication rights auditable rather than assuming a source remains permanently compatible.
- The implementation frontier contains tickets 01, 02, 05, 06 and 07; they can begin independently after ticket publication.
