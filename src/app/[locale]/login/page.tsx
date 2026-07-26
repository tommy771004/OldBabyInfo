import { auth, signIn, signOut } from "@/auth";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { routing, type Locale } from "@/i18n/routing";
import styles from "./login.module.css";

export const dynamic = "force-dynamic";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LoginPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = (await params) as { locale: Locale };
  setRequestLocale(locale);
  const t = await getTranslations("AuthPage");
  const googleConfigured = Boolean(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET);
  const lineConfigured = Boolean(process.env.AUTH_LINE_ID && process.env.AUTH_LINE_SECRET);
  const configured = Boolean(process.env.AUTH_SECRET && (googleConfigured || lineConfigured));

  if (!configured) {
    return (
      <main className={styles.page}>
        <h1>{t("title")}</h1>
        <p>{t("notConfigured")}</p>
      </main>
    );
  }

  const session = await auth();
  if (session?.user) {
    async function signOutAction() {
      "use server";
      await signOut({ redirectTo: "/" });
    }

    return (
      <main className={styles.page}>
        <h1>{t("signedInTitle")}</h1>
        <p>{t("signedInAs", { name: session.user.name ?? t("player") })}</p>
        <form action={signOutAction}>
          <button type="submit">{t("signOut")}</button>
        </form>
      </main>
    );
  }

  async function signInAction() {
    "use server";
    await signIn("google", { redirectTo: "/" });
  }

  async function signInWithLineAction() {
    "use server";
    await signIn("line", { redirectTo: "/" });
  }

  return (
    <main className={styles.page}>
      <h1>{t("title")}</h1>
      <p>{t("privacy")}</p>
      {googleConfigured ? (
        <form action={signInAction}>
          <button type="submit">{t("continueWithGoogle")}</button>
        </form>
      ) : null}
      {lineConfigured ? (
        <form action={signInWithLineAction}>
          <button type="submit">{t("continueWithLine")}</button>
        </form>
      ) : null}
    </main>
  );
}
