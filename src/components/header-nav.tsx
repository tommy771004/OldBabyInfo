"use client";

import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation.ts";
import styles from "./site-header.module.css";

/**
 * The wide-screen half of the top app bar's navigation.
 *
 * It is a client component for one reason: Material 3 requires a navigation
 * item to say whether it is the current destination, and that needs the
 * pathname. The bar used to render seven identical links with no active
 * state at all, so the header could not tell you where you were.
 *
 * The active item takes the M3 navigation-item treatment — a filled
 * `secondary-container` pill, not a dot tacked underneath and not an
 * underline that grows on hover.
 */
const ITEMS = [
  { href: "/parts", key: "mobile_parts" },
  { href: "/combo", key: "mobile_combo" },
  { href: "/guides", key: "mobile_guides" },
  { href: "/events", key: "nav_events" },
  { href: "/discussion", key: "nav_discussion" },
  { href: "/login", key: "nav_login" },
  { href: "/terms", key: "nav_terms" },
] as const;

/** `/meta` is the Meta Standing half of the calendar, so Events owns it. */
function isCurrent(pathname: string, href: string): boolean {
  if (href === "/events") return pathname === "/meta" || pathname === href || pathname.startsWith(`${href}/`);
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function HeaderNav() {
  const t = useTranslations("HomePage");
  const pathname = usePathname();

  return (
    <nav className={styles.nav} aria-label={t("nav_label")}>
      {ITEMS.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={`${styles.navItem} m3-state`}
          aria-current={isCurrent(pathname, item.href) ? "page" : undefined}
        >
          {t(item.key)}
        </Link>
      ))}
    </nav>
  );
}
