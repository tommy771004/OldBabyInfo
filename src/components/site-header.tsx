import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation.ts";
import { LocaleSwitcher } from "@/components/locale-switcher.tsx";
import styles from "./site-header.module.css";

/**
 * Shared public shell navigation. It is deliberately a contained, self-
 * bordered strip rather than a flush row of links pinned to the edges.
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

      <LocaleSwitcher />
    </header>
  );
}
