import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation.ts";
import styles from "./not-found.module.css";

export default function NotFound() {
  const t = useTranslations("NotFoundPage");

  return (
    <main className={styles.page}>
      <p className="stat-value">404</p>
      <h1>{t("title")}</h1>
      <p>{t("description")}</p>
      <Link className="m3-button m3-button--tonal m3-state" href="/">{t("home")}</Link>
    </main>
  );
}
