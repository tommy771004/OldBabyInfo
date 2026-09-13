import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation.ts";
import { HeaderNav } from "@/components/header-nav.tsx";
import { LocaleSwitcher } from "@/components/locale-switcher.tsx";
import { MobileNav } from "@/components/mobile-nav.tsx";
import { NavIcon } from "@/components/nav-icons.tsx";
import styles from "./site-header.module.css";

/**
 * Material 3 top app bar. Leading slot carries the wordmark, the navigation
 * sits inline beside it, and the trailing slot holds the account and locale
 * actions — which is where M3 puts them and where people look for them.
 *
 * The bar is on the field lighting (`m3-dark`), so every M3 role inside it
 * resolves to the ramp's deep end. Nothing in here declares a colour of its
 * own; that is the whole point of the two-scheme token layer.
 *
 * The bar is sticky, so it stays available while the page scrolls under it,
 * and it is opaque rather than blurred — see the stylesheet for why that is
 * a decision and not an omission.
 *
 * `MobileNav` is a SIBLING of the header rather than a child, because a
 * transformed or filtered ancestor becomes the containing block for its
 * `position: fixed` descendants, which would tear the floating pill off the
 * bottom of the viewport and pin it under the top bar instead. Nothing here
 * does that today; keeping them siblings means nothing here can.
 *
 * Below 640px the inline navigation hands over to `MobileNav`, M3's
 * navigation bar within thumb reach. The two never show at once — the wide
 * row is `display: none` at that width, which takes it out of the
 * accessibility tree too, so a screen reader is not offered the same links
 * twice. Sign-in stays in the bar's trailing slot as an icon button, and the
 * one link the navigation bar has no room for gets its own quiet row.
 * Terms is not a destination any more: it reads at the foot of the home
 * page, reachable from the footer, so it left the bar altogether.
 */
export function SiteHeader() {
  const t = useTranslations("HomePage");

  return (
    <>
      <header className={`${styles.header} m3-dark`}>
        <div className={styles.bar}>
          <Link href="/" className={`${styles.wordmark} m3-state`} aria-label={t("nav_home")}>
            Old<span className={styles.wordmarkAccent}>Baby</span>Info
          </Link>

          <HeaderNav />

          <div className={styles.actions}>
            <LocaleSwitcher />
            <Link
              className={`${styles.cornerLogin} m3-icon-button m3-state`}
              href="/login"
              aria-label={t("nav_login")}
            >
              <NavIcon name="login" size={24} />
            </Link>
          </div>
        </div>

        <div className={styles.mobileSecondary}>
          <Link className={`${styles.mobileSecondaryItem} m3-state`} href="/discussion">
            {t("nav_discussion")}
          </Link>
        </div>
      </header>

      <MobileNav />
    </>
  );
}
