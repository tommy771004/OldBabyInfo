# 每類資料有固定的 Field Authority

五個來源彼此重疊，而且官方數值、通路快照與社群判斷的可信方式不同，因此不能使用「最後抓到的值」覆蓋同名欄位。Part 名稱、官方 Stat、Mode 與零件關係由 BeyBrew 所附官方 App MasterData 決定；售價、庫存與商品連結由 Funbox 等實際通路決定；Event 排程由原始賽事試算表決定；BeybladeHub、HackMD、Go-Shoot 可提供 Tier、配置、打法、重量觀察、Mold Batch 與 Alias，但不得覆蓋官方 Stat。

## Consequences

- 來源間的客觀欄位衝突不是自動合併問題；非 Field Authority 的值只能保留為觀察或送人工檢查。
- 每條抓取管線只能寫入自己擁有的資料家族。
- 更換 Field Authority 是資料遷移與重新驗證，不是調整爬蟲優先順序。

## Cross-generation Catalog authority extension

- Official Takara Tomy history determines the four top-level Generations and their chronology.
- Official product pages and manuals determine System structure, complete Beyblade composition, Release SKU／region／colorway／reissue facts, and Equipment contents within their scope.
- BeyBrew MasterData remains the Field Authority for X App-derived Part names, official Stats, Modes, and X Part relationships; it is not an authority for Original Generation, Metal Fight, or Burst.
- Licensed community catalogs may provide candidate names, aliases, and historical Part indexes. They retain community provenance and cannot overwrite an official value.
- Funbox is the Field Authority for its own Stock Listing price, availability, URL, and capture time. A retailer row may attach to a Release only after a unique source-backed match.
- BeybladeHub, HackMD, Go-Shoot, and similar pages are Discovery Sources for aliases, observations, and leads. They do not decide official structure, SKU, or Stats.
- Wikipedia and other general references are cross-checks for Generation-level facts only, never Part or SKU authorities.

## phstudy migration exceptions

The owner-approved phstudy migration is a scoped exception to the X Part rule
above. For a merged Bit, phstudy is the Field Authority for the fields named by
that Part's `phstudy-beyblade-x` provenance entry, including `nameEn`, `nameJa`,
`nameZhTw`, and `aliases`. Those names and aliases are projected from the stable
`groupId` and `part_code_names.json`; SKU display labels are not Part names.
Absence remains non-authoritative and cannot erase a curated value.

ADR-0013 grants the corresponding classification and per-provenance exception
for Blade and Ratchet. The staged-source policy and exact merge behavior are
documented in `data/sources/phstudy/README.md`.
