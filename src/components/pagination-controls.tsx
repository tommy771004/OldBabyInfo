import styles from "./pagination-controls.module.css";

export interface PaginationControlsLabels {
  pageSize: string;
  pageStatus: (page: number, totalPages: number) => string;
  previousPage: string;
  nextPage: string;
}

/**
 * The one set of paging controls on the site (ADR-0014: one role, one
 * component). Page size is a choice with a visible state, so it is a row of
 * M3 filter chips; previous/next are text buttons; the status line is
 * `aria-live` so a screen reader hears the page change without the focus
 * moving. Every control is a real link: the page is a URL, not client state.
 */
export function PaginationControls<Size extends number>({
  page,
  pageSize,
  totalPages,
  sizes,
  hrefFor,
  labels,
  ariaLabel,
}: {
  page: number;
  pageSize: Size;
  totalPages: number;
  sizes: readonly Size[];
  hrefFor: (page: number, pageSize: Size) => string;
  labels: PaginationControlsLabels;
  ariaLabel: string;
}) {
  return (
    <nav className={styles.pagination} aria-label={ariaLabel}>
      <div className={styles.pageSizes} aria-label={labels.pageSize}>
        <span className={styles.pageSizesLabel}>{labels.pageSize}</span>
        {sizes.map((size) => (
          <a
            key={size}
            className="m3-chip m3-state"
            href={hrefFor(1, size)}
            aria-current={pageSize === size ? "true" : undefined}
          >
            {size}
          </a>
        ))}
      </div>
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
