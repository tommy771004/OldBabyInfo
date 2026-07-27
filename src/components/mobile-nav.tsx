"use client";

import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation.ts";
import { NavIcon, type NavIconName } from "./nav-icons.tsx";
import styles from "./mobile-nav.module.css";

const ITEMS: Array<{ href: string; icon: NavIconName; labelKey: string }> = [
  { href: "/parts", icon: "parts", labelKey: "nav_parts" },
  { href: "/events", icon: "events", labelKey: "nav_events" },
  { href: "/discussion", icon: "discussion", labelKey: "nav_discussion" },
  { href: "/login", icon: "login", labelKey: "nav_login" },
  { href: "/terms", icon: "terms", labelKey: "nav_terms" },
];

/**
 * The phone-width navigation: a floating glass pill, icons only.
 *
 * Client-side only because of `usePathname` — an icon-only bar with no
 * current-page marker leaves a reader with nothing to orient by, which is
 * exactly what the text labels were doing on wider screens. The label still
 * exists on every item as its accessible name, so dropping the visible text
 * costs sighted density, not screen-reader information.
 */
export function MobileNav() {
  const t = useTranslations("HomePage");
  const pathname = usePathname();

  return (
    <nav className={styles.bar} aria-label={t("nav_label")}>
      {ITEMS.map((item) => {
        const current = pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={styles.item}
            aria-label={t(item.labelKey as "nav_parts")}
            aria-current={current ? "page" : undefined}
          >
            <NavIcon name={item.icon} />
          </Link>
        );
      })}
    </nav>
  );
}
