import { SITE_URL } from "@/lib/seo.ts";

const content = `# OldBabyInfo

OldBabyInfo is a player-maintained, non-official Beyblade X reference site from Taiwan. It organizes sourced part data, official stats, combos, event results, event listings, and community observations.

繁體中文：OldBabyInfo 是台灣玩家整理的非官方戰鬥陀螺 X 查詢工具，提供有來源的零件、組合、賽事與社群資料。

日本語：OldBabyInfoは台湾のプレイヤーが運営する非公式ベイブレードX情報サイトです。出典付きのパーツ、コンボ、大会、コミュニティデータを整理しています。

## Canonical entry points

- Traditional Chinese: ${SITE_URL}/
- English: ${SITE_URL}/en
- Japanese: ${SITE_URL}/ja
- Parts library: ${SITE_URL}/parts
- Event calendar: ${SITE_URL}/events
- Beginner guides: ${SITE_URL}/guides
- Combo builder: ${SITE_URL}/combo
- Terms and disclaimer: ${SITE_URL}/#terms

## Data policy

Official statistics and community observations are labeled separately. Community claims are not presented as official facts. Retail availability and prices are temporary snapshots and are not transactions handled by OldBabyInfo.
`;

export function GET() {
  return new Response(content, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
