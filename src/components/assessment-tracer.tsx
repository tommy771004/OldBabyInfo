import type { Assessment, AssessmentKind } from "@/lib/assessments/schema.ts";
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
}

export function AssessmentTracer({
  assessments,
  labels,
  headingId = "assessment-tracer-heading",
}: {
  assessments: Assessment[];
  labels: AssessmentTracerLabels;
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
    </section>
  );
}
