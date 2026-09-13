import { notFound } from "next/navigation";
import { useTranslations } from "next-intl";
import type { Locale } from "@/i18n/routing";
import { requireLocale } from "@/i18n/require-locale.ts";
import { DiagonalArrow } from "@/components/diagonal-arrow.tsx";
import { DetailDialog, DetailDialogActions } from "@/components/detail-dialog.tsx";
import { getAllPublishableGenerationCatalogRecords } from "@/lib/generation-catalog/repository.ts";
import type { GenerationCatalogRecord } from "@/lib/generation-catalog/schema.ts";
import { GenerationCatalogRecordBody } from "../../../catalog/[id]/record-body.tsx";

/**
 * `/parts/catalog/[id]` reached by a click inside `/parts`: the Catalog
 * record as a dialog over the list. The record is static JSON in full, so
 * the dialog shows everything the page shows.
 */
export default async function CatalogRecordModalPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await requireLocale(params);
  const records = getAllPublishableGenerationCatalogRecords();
  let recordId: string;
  try {
    recordId = decodeURIComponent(id);
  } catch {
    notFound();
  }
  const record = records.find((candidate) => candidate.id === recordId);
  if (!record) notFound();

  return (
    <CatalogRecordModal
      locale={locale}
      record={record}
      siblings={records.filter((candidate) => candidate.generationId === record.generationId)}
    />
  );
}

function CatalogRecordModal({
  locale,
  record,
  siblings,
}: {
  locale: Locale;
  record: GenerationCatalogRecord;
  siblings: GenerationCatalogRecord[];
}) {
  const t = useTranslations("PartDetailPage");
  const prefix = locale === "zh-TW" ? "" : `/${encodeURIComponent(locale)}`;

  return (
    // Keyed so a swap to another record inside the dialog remounts it: the
    // body's scroll position resets and focus lands on the close mark
    // again instead of on nothing (the link that was clicked is gone).
    <DetailDialog key={record.id} closeLabel={t("dialog_close")} labelledBy="catalog-dialog-heading">
      <GenerationCatalogRecordBody
        locale={locale}
        record={record}
        siblings={siblings}
        variant="dialog"
        headingId="catalog-dialog-heading"
      />
      <DetailDialogActions>
        <a className="m3-button m3-button--text m3-state" href={`${prefix}/parts/catalog/${encodeURIComponent(record.id)}`}>
          {t("dialog_full_page")} <DiagonalArrow />
        </a>
      </DetailDialogActions>
    </DetailDialog>
  );
}
