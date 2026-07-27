import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation.ts";
import { LocaleSwitcher } from "@/components/locale-switcher.tsx";
import { MobileNav } from "@/components/mobile-nav.tsx";
import { NavIcon } from "@/components/nav-icons.tsx";
import styles from "./site-header.module.css";

/**
 * Shared public shell navigation. It is deliberately a contained, self-
 * bordered strip rather than a flush row of links pinned to the edges.
 *
 * Below 640px the text row hands over to `MobileNav`, a floating icon-only
 * glass pill within thumb reach. The two never show at once — the header row
 * is `display: none` at that width, which takes it out of the accessibility
 * tree too, so a screen reader is not offered the same links twice.
 *
 * Sign-in is the exception: it sits in the header's top-right corner rather
 * than in the bar, which is where an account control is looked for, and the
 * header sticks at phone width so it stays reachable down the page.
 */
export function SiteHeader() {
  const t = useTranslations("HomePage");

  return (
    <header className={styles.header}>
      <span className={styles.wordmark}>
        Old<span className={styles.wordmarkAccent}>Baby</span>Info
      </span>

      <nav className={styles.nav} aria-label={t("nav_label")}>
        <Link href="/parts">{t("nav_parts")}</Link>
        <Link href="/events">{t("nav_events")}</Link>
        <Link href="/discussion">{t("nav_discussion")}</Link>
        <Link href="/login">{t("nav_login")}</Link>
        <Link href="/terms">{t("nav_terms")}</Link>
      </nav>

      <div className={styles.corner}>
        <LocaleSwitcher />
        <Link className={styles.cornerLogin} href="/login" aria-label={t("nav_login")}>
          <NavIcon name="login" size={20} />
        </Link>
      </div>

      <MobileNav />
    </header>
  );
}
