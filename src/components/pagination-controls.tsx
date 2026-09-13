import styles from "./pagination-controls.module.css";

export interface PaginationControlsLabels {
  pageSize: string;
  pageStatus: (page: number, totalPages: number) => string;
  previousPage: string;
  nextPage: string;
}

/**
 * The page-size choice, on its own. It is a row of M3 filter chips because
 * it is a choice with a visible state, and every chip is a real link back to
 * page 1 at the new size. Lives apart from the prev/next pair so a page can
 * seat it with its filters (the catalog does) while the pair stays under the
 * list; `PaginationControls` renders it in place when nobody moved it.
 */
export function PageSizeChips<Size extends number>({
  pageSize,
  sizes,
  hrefFor,
  label,
  className = styles.pageSizes,
  labelClassName = styles.pageSizesLabel,
  chipsClassName,
}: {
  pageSize: Size;
  sizes: readonly Size[];
  hrefFor: (page: number, pageSize: Size) => string;
  label: string;
  className?: string;
  labelClassName?: string;
  chipsClassName?: string;
}) {
  const chips = sizes.map((size) => (
    <a
      key={size}
      className="m3-chip m3-state"
      href={hrefFor(1, size)}
      aria-current={pageSize === size ? "true" : undefined}
    >
      {size}
    </a>
  ));
  return (
    <nav className={className} aria-label={label}>
      <span className={labelClassName}>{label}</span>
      {chipsClassName ? <span className={chipsClassName}>{chips}</span> : chips}
    </nav>
  );
}

/**
 * The one set of paging controls on the site (ADR-0014: one role, one
 * component). Previous/next are text buttons; the status line is `aria-live`
 * so a screen reader hears the page change without the focus moving. The
 * page-size chips render above the pair unless `pageSizesElsewhere` says the
 * page already placed them. Every control is a real link: the page is a URL,
 * not client state.
 */
export function PaginationControls<Size extends number>({
  page,
  pageSize,
  totalPages,
  sizes,
  hrefFor,
  labels,
  ariaLabel,
  pageSizesElsewhere = false,
}: {
  page: number;
  pageSize: Size;
  totalPages: number;
  sizes: readonly Size[];
  hrefFor: (page: number, pageSize: Size) => string;
  labels: PaginationControlsLabels;
  ariaLabel: string;
  pageSizesElsewhere?: boolean;
}) {
  return (
    <nav className={styles.pagination} aria-label={ariaLabel}>
      {pageSizesElsewhere ? null : (
        <PageSizeChips pageSize={pageSize} sizes={sizes} hrefFor={hrefFor} label={labels.pageSize} />
      )}
      <div className={styles.pageControls}>
        {page > 1 ? (
          <a className="m3-button m3-button--text m3-state" href={hrefFor(page - 1, pageSize)}>
            {labels.previousPage}
          </a>
        ) : (
          <span className="m3-button m3-button--text" aria-disabled="true">{labels.previousPage}</span>
        )}
        <span className={styles.pageStatus} aria-live="polite">
          {labels.pageStatus(page, totalPages)}
        </span>
        {page < totalPages ? (
          <a className="m3-button m3-button--text m3-state" href={hrefFor(page + 1, pageSize)}>
            {labels.nextPage}
          </a>
        ) : (
          <span className="m3-button m3-button--text" aria-disabled="true">{labels.nextPage}</span>
        )}
      </div>
    </nav>
  );
}
