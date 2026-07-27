"use client";

import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation.ts";
import { NavIcon, type NavIconName } from "./nav-icons.tsx";
import styles from "./mobile-nav.module.css";

/** Sign-in is deliberately absent: it lives in the header's top-right
 *  corner, where an account control is looked for, leaving the bar to the
 *  five places you actually browse between. */
const ITEMS: Array<{ href: string; icon: NavIconName; labelKey: string }> = [
  { href: "/", icon: "home", labelKey: "nav_home" },
  { href: "/parts", icon: "parts", labelKey: "nav_parts" },
  { href: "/events", icon: "events", labelKey: "nav_events" },
  { href: "/discussion", icon: "discussion", labelKey: "nav_discussion" },
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
        // "/" would otherwise prefix-match every route.
        const current = item.href === "/"
          ? pathname === "/"
          : pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={styles.item}
            aria-label={t(item.labelKey as "nav_home")}
            aria-current={current ? "page" : undefined}
          >
            <NavIcon name={item.icon} />
          </Link>
        );
      })}
    </nav>
  );
}
