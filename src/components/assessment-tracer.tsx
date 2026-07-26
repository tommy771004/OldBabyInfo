import type { Assessment, AssessmentKind } from "@/lib/assessments/schema.ts";
import { ASSESSMENT_PAGE_SIZES, type AssessmentPaginationState } from "@/lib/assessments/pagination.ts";
import styles from "./assessment-tracer.module.css";

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
}: {
  assessments: Assessment[];
  labels: AssessmentTracerLabels;
  pagination?: AssessmentPaginationState & { pathname: string };
}) {
  return (
    <section className={styles.section} aria-labelledby="assessment-tracer-heading">
      <h2 id="assessment-tracer-heading">{labels.heading}</h2>
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
                      <a href={assessment.evidenceSource.url}>{assessment.evidenceSource.label}</a>
                    </>
                  ) : (
                    <span>{labels.unattributed}</span>
                  )}
                </dd>
                <dt>{labels.discoverySource}</dt>
                <dd>
                  <a href={assessment.discoverySource.url}>{assessment.discoverySource.label}</a>
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
      <div className={styles.pageSizes} aria-label={labels.pageSize}>
        {ASSESSMENT_PAGE_SIZES.map((pageSize) => (
          <a
            key={pageSize}
            href={queryHref(1, pageSize)}
            aria-current={pagination.pageSize === pageSize ? "true" : undefined}
          >
            {pageSize}
          </a>
        ))}
      </div>
      <div className={styles.pageControls}>
        {pagination.page > 1 ? (
          <a href={queryHref(pagination.page - 1, pagination.pageSize)}>{labels.previousPage}</a>
        ) : (
          <span aria-disabled="true">{labels.previousPage}</span>
        )}
        <span aria-live="polite">{labels.pageStatus(pagination.page, pagination.totalPages)}</span>
        {pagination.page < pagination.totalPages ? (
          <a href={queryHref(pagination.page + 1, pagination.pageSize)}>{labels.nextPage}</a>
        ) : (
          <span aria-disabled="true">{labels.nextPage}</span>
        )}
      </div>
    </nav>
  );
}
