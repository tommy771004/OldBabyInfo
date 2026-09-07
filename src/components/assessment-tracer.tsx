import type { Assessment, AssessmentKind } from "@/lib/assessments/schema.ts";
import { ASSESSMENT_PAGE_SIZES, type AssessmentPaginationState } from "@/lib/assessments/pagination.ts";
import styles from "./assessment-tracer.module.css";
import { ExternalLink } from "./external-link.tsx";

export interface AssessmentTracerLabels {
  heading: string;
  kindLabel: (kind: AssessmentKind) => string;
  unattributed: string;
  excerpt: string;
  discoverySource: string;
  evidenceSource: string;
  capturedAt: string;
  pageSize: string;
  pageStatus: (page: number, totalPages: number) => string;
  previousPage: string;
  nextPage: string;
}

export function AssessmentTracer({
  assessments,
  labels,
  pagination,
  headingId = "assessment-tracer-heading",
}: {
  assessments: Assessment[];
  labels: AssessmentTracerLabels;
  pagination?: AssessmentPaginationState & { pathname: string };
  headingId?: string;
}) {
  return (
    <section className={styles.section} aria-labelledby={headingId}>
      <h2 id={headingId}>{labels.heading}</h2>
      {assessments.length > 0 ? (
        <div className={styles.list}>
          {assessments.map((assessment) => (
            <article className={styles.assessment} key={assessment.id}>
              <p className={styles.kind}>{labels.kindLabel(assessment.kind)}</p>
              <h3>{assessment.value}</h3>
              <p>{assessment.summary}</p>

              <dl className={styles.details}>
                <dt>{labels.excerpt}</dt>
                <dd className={styles.excerpt}>{assessment.sourceExcerpt}</dd>
                <dt>{labels.capturedAt}</dt>
                <dd>{assessment.capturedAt}</dd>
                <dt>{labels.evidenceSource}</dt>
                <dd>
                  {assessment.evidenceSource ? (
                    <>
                      <span>{assessment.evidenceSource.author}</span>{" · "}
                      <ExternalLink href={assessment.evidenceSource.url}>{assessment.evidenceSource.label}</ExternalLink>
                    </>
                  ) : (
                    <span>{labels.unattributed}</span>
                  )}
                </dd>
                <dt>{labels.discoverySource}</dt>
                <dd>
                  <ExternalLink href={assessment.discoverySource.url}>{assessment.discoverySource.label}</ExternalLink>
                </dd>
              </dl>
            </article>
          ))}
        </div>
      ) : null}
      {pagination ? <AssessmentPagination pagination={pagination} labels={labels} /> : null}
    </section>
  );
}

function AssessmentPagination({
  pagination,
  labels,
}: {
  pagination: AssessmentPaginationState & { pathname: string };
  labels: AssessmentTracerLabels;
}) {
  const queryHref = (page: number, pageSize: number) =>
    `${pagination.pathname}?assessmentPage=${page}&assessmentSize=${pageSize}`;

  return (
    <nav className={styles.pagination} aria-label={labels.heading}>
      {/* Page size is a choice with a visible state, so it is a set of M3
          filter chips; the page controls are text buttons. */}
      <div className={styles.pageSizes} aria-label={labels.pageSize}>
        <span className={styles.pageSizesLabel}>{labels.pageSize}</span>
        {ASSESSMENT_PAGE_SIZES.map((pageSize) => (
          <a
            key={pageSize}
            className="m3-chip m3-state"
            href={queryHref(1, pageSize)}
            aria-current={pagination.pageSize === pageSize ? "true" : undefined}
          >
            {pageSize}
          </a>
        ))}
      </div>
      <div className={styles.pageControls}>
        {pagination.page > 1 ? (
          <a className="m3-button m3-button--text m3-state" href={queryHref(pagination.page - 1, pagination.pageSize)}>
            {labels.previousPage}
          </a>
        ) : (
          <span className="m3-button m3-button--text" aria-disabled="true">{labels.previousPage}</span>
        )}
        <span className={styles.pageStatus} aria-live="polite">
          {labels.pageStatus(pagination.page, pagination.totalPages)}
        </span>
        {pagination.page < pagination.totalPages ? (
          <a className="m3-button m3-button--text m3-state" href={queryHref(pagination.page + 1, pagination.pageSize)}>
            {labels.nextPage}
          </a>
        ) : (
          <span className="m3-button m3-button--text" aria-disabled="true">{labels.nextPage}</span>
        )}
      </div>
    </nav>
  );
}
