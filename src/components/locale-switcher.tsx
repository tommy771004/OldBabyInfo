"use client";

import { useLocale, useTranslations } from "next-intl";
import { routing, type Locale } from "@/i18n/routing";
import { usePathname, useRouter } from "@/i18n/navigation";

/**
 * Material 3 compact select (`m3-select`). It appears in two places at
 * opposite ends of the ramp — the dark top app bar and the light footer —
 * and carries no colour of its own, so the scheme the surrounding surface
 * declares is the one it takes.
 */
export function LocaleSwitcher() {
  const t = useTranslations("LocaleSwitcher");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  return (
    <label className="m3-select">
      <span className="m3-visually-hidden">{t("label")}</span>
      <select
        value={locale}
        onChange={(event) => {
          // Safe: the select's options are rendered 1:1 from routing.locales.
          router.replace(pathname, { locale: event.target.value as Locale });
        }}
      >
        {routing.locales.map((loc) => (
          <option key={loc} value={loc}>
            {t(loc)}
          </option>
        ))}
      </select>
    </label>
  );
}
