import { notFound } from "next/navigation";
import { requireLocale } from "@/i18n/require-locale.ts";

/** Keep unmatched public URLs inside the locale layout and its 404 UI. */
export default async function UnmatchedPage({
  params,
}: {
  params: Promise<{ locale: string; rest: string[] }>;
}) {
  await requireLocale(params);
  notFound();
}
