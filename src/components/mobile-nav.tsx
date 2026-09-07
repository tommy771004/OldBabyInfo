"use client";

import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation.ts";
import { NavIcon, type NavIconName } from "./nav-icons.tsx";
import styles from "./mobile-nav.module.css";

/** Core lookup tasks stay visible. Home, account, discussion and terms
 * remain reachable from the shared header. */
const ITEMS: Array<{
  href: string;
  icon: NavIconName;
  labelKey: "mobile_parts" | "mobile_combo" | "mobile_events" | "mobile_guides";
}> = [
  { href: "/parts", icon: "parts", labelKey: "mobile_parts" },
  { href: "/combo", icon: "combo", labelKey: "mobile_combo" },
  { href: "/events", icon: "events", labelKey: "mobile_events" },
  { href: "/guides", icon: "terms", labelKey: "mobile_guides" },
];

/**
 * The floating navigation pill, running Material 3's navigation-bar
 * behaviour (owner-decided shape — see the stylesheet).
 *
 * Labels follow M3's "selected" label visibility: the destination you are on
 * names itself, the rest are their glyph alone, and pressing or tabbing to
 * one shows its label before the page has changed. The label is CSS-hidden,
 * never removed — every item carries an `aria-label`, so the accessible name
 * is there whether or not the text is painted.
 */
export function MobileNav() {
  const t = useTranslations("HomePage");
  const pathname = usePathname();

  return (
    <nav className={`${styles.bar} m3-dark`} aria-label={t("nav_label")}>
      {ITEMS.map((item) => {
        const current = pathname === item.href || pathname.startsWith(`${item.href}/`)
          || (item.href === "/events" && pathname === "/meta");
        return (
          <Link
            key={item.href}
            href={item.href}
            className={styles.item}
            aria-label={t(item.labelKey)}
            aria-current={current ? "page" : undefined}
          >
            <span className={styles.indicator}>
              <NavIcon name={item.icon} />
            </span>
            <span className={styles.label}>{t(item.labelKey)}</span>
          </Link>
        );
      })}
    </nav>
  );
}
