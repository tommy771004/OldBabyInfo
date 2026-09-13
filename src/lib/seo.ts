import type { Metadata } from "next";
import { createElement } from "react";
import type { Locale } from "@/i18n/routing";

export const SITE_NAME = "OldBabyInfo";
function normalizeOrigin(value: string | undefined): string | undefined {
  if (!value) return undefined;
  const withProtocol = /^https?:\/\//.test(value) ? value : `https://${value}`;
  return withProtocol.replace(/\/$/, "");
}

/** Prefer the explicitly configured canonical domain. Preview deployments must
 * not become canonical URLs; the documented production host is the safe build
 * fallback when Vercel has not injected its production-domain variable. */
export const SITE_URL =
  normalizeOrigin(
    process.env.NEXT_PUBLIC_SITE_URL ??
      process.env.VERCEL_PROJECT_PRODUCTION_URL ??
      (process.env.NODE_ENV === "production" ? "https://old-baby-info.vercel.app" : undefined),
  ) ?? "http://localhost:3000";
const GOOGLE_SITE_VERIFICATION = "6KE8Qp5p0dXMp1etepmmhRmw7fG_SRwVuBampfeCL5M";

const localePathPrefix: Record<Locale, string> = {
  "zh-TW": "",
  ja: "/ja",
  en: "/en",
};

/** Build the public URL for a locale while keeping the existing as-needed
 * routing contract: Traditional Chinese is the unprefixed default. */
export function localizedPath(locale: Locale, pathname = "/"): string {
  const normalizedPath = pathname === "/" ? "" : `/${pathname.replace(/^\/+/, "")}`;
  return `${localePathPrefix[locale]}${normalizedPath}` || "/";
}

export function absoluteUrl(pathname: string): string {
  return new URL(pathname, `${SITE_URL}/`).toString();
}

export function localizedUrl(locale: Locale, pathname = "/"): string {
  return absoluteUrl(localizedPath(locale, pathname));
}

const allLocales: readonly Locale[] = ["zh-TW", "ja", "en"];

export function localizedAlternates(
  pathname = "/",
  locales: readonly Locale[] = allLocales,
) {
  const languages = Object.fromEntries(
    locales.map((locale) => [locale, localizedUrl(locale, pathname)]),
  );
  const xDefaultLocale = locales.includes("zh-TW") ? "zh-TW" : locales[0];

  return {
    canonical: localizedUrl("zh-TW", pathname),
    languages: {
      ...languages,
      ...(xDefaultLocale ? { "x-default": localizedUrl(xDefaultLocale, pathname) } : {}),
    },
  };
}

const pageKeywords: Record<Locale, string[]> = {
  "zh-TW": ["戰鬥陀螺 X", "Beyblade X", "零件資料", "賽事結果", "Combo"],
  ja: ["ベイブレードX", "Beyblade X", "パーツデータ", "大会結果", "コンボ"],
  en: ["Beyblade X", "Beyblade parts", "event results", "combo builder", "parts data"],
};

export function pageMetadata({
  locale,
  pathname,
  title,
  description,
  noIndex = false,
  alternateLocales = allLocales,
}: {
  locale: Locale;
  pathname?: string;
  title: string;
  description: string;
  noIndex?: boolean;
  alternateLocales?: readonly Locale[];
}): Metadata {
  const url = localizedUrl(locale, pathname);

  return {
    metadataBase: new URL(`${SITE_URL}/`),
    title: `${title} | ${SITE_NAME}`,
    description,
    keywords: pageKeywords[locale],
    verification: { google: GOOGLE_SITE_VERIFICATION },
    alternates: {
      ...localizedAlternates(pathname, alternateLocales),
      canonical: url,
    },
    robots: noIndex ? { index: false, follow: true } : { index: true, follow: true },
    openGraph: {
      type: "website",
      url,
      siteName: SITE_NAME,
      title: `${title} | ${SITE_NAME}`,
      description,
      locale: locale === "zh-TW" ? "zh_TW" : locale,
    },
    twitter: {
      card: "summary",
      title: `${title} | ${SITE_NAME}`,
      description,
    },
  };
}

const seoCopy = {
  home: {
    "zh-TW": {
      title: "戰鬥陀螺 X 查詢工具",
      description: "查詢 Beyblade X 零件、官方數值、Combo 組合與台灣賽事資料。每筆數據標示來源，讓你查得到也查得準。",
    },
    ja: {
      title: "ベイブレードX パーツ検索",
      description: "ベイブレードXのパーツ、公式ステータス、コンボ、台湾大会情報を検索。出典付きのデータを正確に確認できます。",
    },
    en: {
      title: "Beyblade X Parts & Event Database",
      description: "Search Beyblade X parts, official stats, combos, and Taiwan event data with sources for every number.",
    },
  },
  parts: {
    "zh-TW": { title: "Beyblade X 零件庫", description: "瀏覽 Beyblade X 的 Blade、Ratchet、Bit 零件、官方數值、別名與發售資料。" },
    ja: { title: "ベイブレードX パーツ一覧", description: "ベイブレードXのBlade、Ratchet、Bit、公式ステータス、別名、発売情報を検索できます。" },
    en: { title: "Beyblade X Parts Library", description: "Browse Beyblade X Blades, Ratchets, Bits, official stats, aliases, and release data." },
  },
  guides: {
    "zh-TW": { title: "戰鬥陀螺 X 新手指南", description: "從零開始了解 Beyblade X 規則、零件、發射器、競技場與參賽方式。" },
    ja: { title: "ベイブレードX 初心者ガイド", description: "ベイブレードXのルール、パーツ、ランチャー、スタジアム、大会参加を基礎から解説します。" },
    en: { title: "Beyblade X Beginner Guides", description: "Learn Beyblade X rules, parts, launchers, stadiums, and how to join events." },
  },
  events: {
    "zh-TW": { title: "台灣 Beyblade X 賽事行事曆", description: "查詢台灣 Beyblade X 賽事日期、地點、報名方式、名額與主辦方公告。" },
    ja: { title: "台湾ベイブレードX 大会カレンダー", description: "台湾で開催されるベイブレードX大会の日程、会場、申込方法、定員を確認できます。" },
    en: { title: "Taiwan Beyblade X Event Calendar", description: "Find Taiwan Beyblade X event dates, venues, registration methods, capacity, and source announcements." },
  },
  discussion: {
    "zh-TW": { title: "Beyblade X 最新討論", description: "瀏覽附著在零件、Combo 與賽事資料上的 Beyblade X 玩家觀察與討論。" },
    ja: { title: "ベイブレードX 最新ディスカッション", description: "パーツ、コンボ、大会データに紐づいたベイブレードXプレイヤーの観察と議論。" },
    en: { title: "Latest Beyblade X Discussions", description: "Read Beyblade X player observations and discussions attached to parts, combos, and events." },
  },
  combo: {
    "zh-TW": { title: "Beyblade X Combo 建構器", description: "組合 Blade、Ratchet、Bit，快速查看 Beyblade X Combo 的合成數值。" },
    ja: { title: "ベイブレードX コンボビルダー", description: "Blade、Ratchet、Bitを組み合わせ、ベイブレードXコンボの合成ステータスを確認できます。" },
    en: { title: "Beyblade X Combo Builder", description: "Combine a Blade, Ratchet, and Bit to calculate Beyblade X combo stats." },
  },
  compare: {
    "zh-TW": { title: "Beyblade X 零件比較", description: "並排比較 Beyblade X 零件的類型、數值、重量與其他官方資料。" },
    ja: { title: "ベイブレードX パーツ比較", description: "ベイブレードXパーツの種類、ステータス、重量、公式データを並べて比較できます。" },
    en: { title: "Compare Beyblade X Parts", description: "Compare Beyblade X part types, stats, weights, and official data side by side." },
  },
  meta: {
    "zh-TW": { title: "Beyblade X Combo Meta Standing", description: "以實際賽事結果統計 Beyblade X Combo 的使用率、前八強佔比與奪冠次數。賽事使用資料尚未匯入，上線前此頁顯示空狀態。" },
    ja: { title: "ベイブレードX Combo Meta Standing", description: "実際の大会結果からベイブレードXコンボの使用率、ベスト8率、優勝回数を集計。大会データ未投入のため、現在このページは空の状態です。" },
    en: { title: "Beyblade X Combo Meta Standing", description: "Combo usage, top-eight rates, and championship counts computed from recorded event results. Appearance data has not been ingested yet; the page shows an empty state until then." },
  },
  moldBatches: {
    "zh-TW": { title: "Beyblade X 模具批號查詢", description: "查詢 Beyblade X 零件的模具批次觀察與社群實測資料，並查看每筆資料的來源。" },
    ja: { title: "ベイブレードX 金型ロット検索", description: "ベイブレードXパーツの金型ロット観察とコミュニティ実測データを出典付きで確認できます。" },
    en: { title: "Beyblade X Mold Batch Lookup", description: "Look up Beyblade X mold batch observations and community measurements with source attribution." },
  },
  login: {
    "zh-TW": { title: "登入 OldBabyInfo", description: "OldBabyInfo 的帳號登入。附著在資料上的討論目前僅供瀏覽，發表功能尚未開放。" },
    ja: { title: "OldBabyInfoにログイン", description: "OldBabyInfoのアカウントログイン。データに紐づくディスカッションは現在閲覧のみで、投稿は未公開です。" },
    en: { title: "Sign in to OldBabyInfo", description: "Account sign-in for OldBabyInfo. Data-attached discussions are read-only for now; posting is not open yet." },
  },
} as const;

export type SeoPage = keyof typeof seoCopy;

export function localizedSeoCopy(page: SeoPage, locale: Locale) {
  return seoCopy[page][locale];
}

export function pageJsonLd({
  locale,
  pathname,
  title,
  description,
}: {
  locale: Locale;
  pathname: string;
  title: string;
  description: string;
}) {
  const url = localizedUrl(locale, pathname);
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": `${url}#webpage`,
    url,
    name: title,
    description,
    inLanguage: locale,
    isPartOf: { "@id": `${SITE_URL}/#website` },
    publisher: { "@id": `${SITE_URL}/#organization` },
  };
}

export function siteJsonLd(locale: Locale) {
  const home = localizedSeoCopy("home", locale);
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${SITE_URL}/#organization`,
        name: SITE_NAME,
        url: SITE_URL,
        description: home.description,
      },
      {
        "@type": "WebSite",
        "@id": `${SITE_URL}/#website`,
        url: localizedUrl(locale),
        name: SITE_NAME,
        description: home.description,
        inLanguage: locale,
        publisher: { "@id": `${SITE_URL}/#organization` },
      },
    ],
  };
}

/**
 * JSON-LD has to reach the page through `dangerouslySetInnerHTML` — React
 * would otherwise escape the JSON into something no parser accepts — so the
 * escaping happens here instead.
 *
 * `JSON.stringify` is not enough on its own: it passes `<`, `>` and `&`
 * through untouched, and a `</script>` sequence inside any string it
 * serializes closes the tag early and turns whatever follows into markup.
 * Part names, Aliases and source labels all come from ingested data, so this
 * is a live path, not a theoretical one. U+2028/U+2029 are escaped too — they
 * are legal in JSON strings but are line terminators to a script parser.
 */
export function serializeJsonLd(data: object): string {
  return JSON.stringify(data)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}

export function JsonLd({ data }: { data: object }) {
  return createElement("script", {
    type: "application/ld+json",
    dangerouslySetInnerHTML: { __html: serializeJsonLd(data) },
  });
}
